import { ConflictException, HttpException, Injectable } from '@nestjs/common'
import { HashingService } from 'src/shared/services/hashing.service'
import { generateOTP, isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import {
  DisableTwoFactorBodyType,
  ForgotPasswordBodyType,
  LoginBodyType,
  RefreshTokenBodyType,
  RegisterBodyType,
  SendOTPBodyType,
} from './auth.model'
import { AuthRepository } from './auth.repo'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { addMilliseconds } from 'date-fns'
import ms from 'ms'
import envConfig from 'src/shared/config'
import { TypeOfVerificationCode, TypeOfVerificationCodeType } from 'src/shared/constants/auth.constant'
import { EmailService } from 'src/shared/services/email.service'
import { TokenService } from 'src/shared/services/token.service'
import { AccessTokenPayloadCreate } from 'src/shared/types/jwt.type'
import {
  EmailAlreadyExistsException,
  EmailNotFoundException,
  FailedToSendOTPException,
  InvalidOTPException,
  InvalidTOTPAndCodeException,
  InvalidTOTPException,
  OTPExpiredException,
  RefreshTokenAlreadyUsedException,
  TOTPAlreadyEnabledException,
  TOTPNotEnabledException,
  UnauthorizedAccessException,
} from './auth.error'
import { TwoFactorService } from 'src/shared/services/2fa.service'
import { InvalidPasswordException } from 'src/shared/error'
import { SharedRoleRepository } from 'src/shared/repositories/shared-role.repo'

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly sharedRoleRepository: SharedRoleRepository,
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  async validateVerificationCode({ email, type }: { email: string; type: TypeOfVerificationCodeType }) {
    const verificationCode = await this.authRepository.findUniqueVerificationCode({
      email_type: {
        email,
        type,
      },
    })
    if (!verificationCode) {
      throw InvalidOTPException
    }
    if (verificationCode.expiresAt < new Date()) {
      throw OTPExpiredException
    }

    return verificationCode
  }

  async register(body: RegisterBodyType) {
    try {
      await this.validateVerificationCode({
        email: body.email,
        type: TypeOfVerificationCode.REGISTER,
      })

      const clientRoleId = await this.sharedRoleRepository.getClientRoleId()
      const hashedPassword = await this.hashingService.hash(body.password)

      const [user] = await Promise.all([
        this.authRepository.createUser({
          email: body.email,
          name: body.name,
          phoneNumber: body.phoneNumber,
          password: hashedPassword,
          roleId: clientRoleId,
        }),
        this.authRepository.deleteVerificationCode({
          email_type: {
            email: body.email,
            type: TypeOfVerificationCode.REGISTER,
          },
        }),
      ])

      return user
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new ConflictException('Email already exists')
      }
      throw error
    }
  }

  async sendOTP(body: SendOTPBodyType) {
    //Kiểm tra email đã tồn tại hay chưa
    const user = await this.sharedUserRepository.findUnique({ email: body.email })

    if (body.type === TypeOfVerificationCode.REGISTER && user) {
      console.log('fail register')
      throw EmailAlreadyExistsException
    }

    if (body.type === TypeOfVerificationCode.FORGOT_PASSWORD && !user) {
      console.log('fail forgot password')
      throw EmailAlreadyExistsException
    }
    //Tạo mã OTP
    const code = generateOTP()
    await this.authRepository.createVerificationCode({
      email: body.email,
      type: body.type,
      code,
      expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN)),
    })

    //Gửi OTP
    const { error } = await this.emailService.sendOTP({
      email: body.email,
      code,
    })
    if (error) {
      throw FailedToSendOTPException
    }

    return {
      message: 'Gửi mã OTP thành công',
      path: 'code',
    }
  }

  async login(body: LoginBodyType & { userAgent: string; ip: string }) {
    //Lấy thông tin user , kt có tồn tại hay không
    const user = await this.authRepository.findUniqueUserIncludeRole({
      email: body.email,
      deletedAt: null,
    })
    if (!user) {
      throw EmailNotFoundException
    }

    const isPasswordMatch = await this.hashingService.compare(body.password, user.password)
    if (!isPasswordMatch) {
      throw InvalidPasswordException
    }

    //Nếu user bật 2FA thì kiểm tra mã 2FA TOTP Code hoặc OTP code (email)
    if (user.totpSecret) {
      //Nếu không có 2 loại mã thì thông báo
      if (!body.totpCode && !body.code) {
        throw InvalidTOTPAndCodeException
      }

      //Kt TOTP có hợp lệ không
      if (body.totpCode) {
        const inValid = this.twoFactorService.verifyTOTP({
          email: user.email,
          secret: user.totpSecret,
          token: body.totpCode,
        })
        if (!inValid) {
          throw InvalidTOTPException
        }
      } else if (body.code) {
        //Kiểm tra OTP có hợp lệ không
        await this.validateVerificationCode({
          email: user.email,

          type: TypeOfVerificationCode.LOGIN,
        })
      }
    }

    //Tạo mới device
    const device = await this.authRepository.createDevice({
      userId: user.id,
      userAgent: body.userAgent,
      ip: body.ip,
      isActive: true,
      lastActive: new Date(),
    })

    //Tạo mới accessToken và refreshToken
    const token = await this.generateTokens({
      userId: user.id,
      roleId: user.roleId,
      roleName: user.role.name,
      deviceId: device.id,
    })
    return token
  }

  async generateTokens({ userId, deviceId, roleId, roleName }: AccessTokenPayloadCreate) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId,
        deviceId,
        roleId,
        roleName,
      }),
      this.tokenService.signRefreshToken({ userId }),
    ])

    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken)
    await this.authRepository.createRefreshToken({
      token: refreshToken,
      userId,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
      deviceId,
    })
    return {
      accessToken,
      refreshToken,
    }
  }

  async refreshToken({ refreshToken, userAgent, ip }: RefreshTokenBodyType & { userAgent: string; ip: string }) {
    try {
      // Kt có hợp lệ k
      const { userId } = await this.tokenService.verifyRefreshToken(refreshToken)

      //Kiểm tra có tồn tại trong db k
      const refreshTokenInDB = await this.authRepository.findUniqueRefreshTokenIncludeUserRole({ token: refreshToken })
      if (!refreshTokenInDB) {
        throw RefreshTokenAlreadyUsedException
      }

      //Lấy dữ liệu
      const {
        deviceId,
        user: {
          roleId,
          role: { name: roleName },
        },
      } = refreshTokenInDB

      //Cập nhập device
      const $updateDevice = this.authRepository.updateDevice(deviceId, {
        ip,
        userAgent,
      })

      //Xoá tồn tại trong db
      const $deleteRefreshToken = this.authRepository.deleteRefreshToken({ token: refreshToken })

      //Tạo mới accessTone và refreshToken
      const $tokens = this.generateTokens({ userId, deviceId, roleId, roleName })

      const [, , tokens] = await Promise.all([$updateDevice, $deleteRefreshToken, $tokens])
      return tokens
    } catch (error) {
      if (error instanceof HttpException) throw error

      throw UnauthorizedAccessException
    }
  }

  async logout(refreshToken: string) {
    try {
      // Kt có hợp lệ k
      await this.tokenService.verifyRefreshToken(refreshToken)

      //Xoá tồn tại trong db
      const deletedRefreshToken = await this.authRepository.deleteRefreshToken({ token: refreshToken })

      //Cập nhập device đã logout
      await this.authRepository.updateDevice(deletedRefreshToken.deviceId, {
        isActive: false,
      })

      return { message: 'Logout successfully' }
    } catch (error) {
      //Trường hợp refreshToken không có trong db
      if (isNotFoundPrismaError(error)) {
        throw RefreshTokenAlreadyUsedException
      }

      //trường hợp lỗi chung
      throw UnauthorizedAccessException
    }
  }

  async forgotPassword(body: ForgotPasswordBodyType) {
    const { email, code, newPassword } = body

    //Kiểm tra email có trong DB chưa
    const user = await this.sharedUserRepository.findUnique({ email, deletedAt: null })
    if (!user) {
      throw EmailNotFoundException
    }

    //Kiểm tra OTP có hợp lệ không
    await this.validateVerificationCode({
      email,

      type: TypeOfVerificationCode.FORGOT_PASSWORD,
    })

    //Cập nhập mật khẩu mới và xoá OTP
    const hashedPassword = await this.hashingService.hash(newPassword)
    await Promise.all([
      this.sharedUserRepository.update(
        { id: user.id, deletedAt: null },
        { password: hashedPassword, updatedById: user.id },
      ),
      this.authRepository.deleteVerificationCode({
        email_type: {
          email,
          type: TypeOfVerificationCode.FORGOT_PASSWORD,
        },
      }),
    ])

    return {
      message: 'Đổi mật khẩu thành công',
    }
  }

  async setupTwoFactorAuth(userId: number) {
    //Lấy thông tin user, kiểm tra user có tồn tại và bật 2FA chưa
    const user = await this.sharedUserRepository.findUnique({ id: userId, deletedAt: null })
    if (!user) {
      throw EmailNotFoundException
    }

    if (user.totpSecret) {
      throw TOTPAlreadyEnabledException
    }

    //Tạo secret và URI
    const { secret, uri } = this.twoFactorService.generateTOTPSecret(user.email)

    //Cập nhập secret vào user trong DB
    await this.sharedUserRepository.update({ id: userId, deletedAt: null }, { totpSecret: secret, updatedById: userId })

    //Trả về secret và uri
    return {
      secret,
      uri,
    }
  }

  async disableTwoFactorAuth(data: DisableTwoFactorBodyType & { userId: number }) {
    const { userId, totpCode, code } = data

    // Lấy thông tin user , kiểm tra đã bật 2FA chưa
    const user = await this.sharedUserRepository.findUnique({ id: userId, deletedAt: null })
    if (!user) {
      throw EmailNotFoundException
    }
    if (!user.totpSecret) {
      throw TOTPNotEnabledException
    }

    //Kt mã TOTP có hợp lệ ?
    if (totpCode) {
      const inValid = this.twoFactorService.verifyTOTP({
        email: user.email,
        secret: user.totpSecret,
        token: totpCode,
      })
      if (!inValid) {
        throw InvalidTOTPException
      }
    } else if (code) {
      //Kt mã OTP có hợp lệ ?
      await this.validateVerificationCode({
        email: user.email,
        type: TypeOfVerificationCode.DISABLE_2FA,
      })
    }

    //Xoá secret trong DB
    await this.sharedUserRepository.update({ id: userId, deletedAt: null }, { totpSecret: null, updatedById: userId })

    return {
      message: 'Đã tắt xác thực 2FA thành công',
    }
  }
}

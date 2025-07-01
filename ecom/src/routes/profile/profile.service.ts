import { Injectable } from '@nestjs/common'
import { InvalidPasswordException, NotFoundRecordException } from 'src/shared/error'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { HashingService } from 'src/shared/services/hashing.service'
import { ChangePasswordBodyType, UpdateMeBodyType } from './profile.model'
import { isUniqueConstraintPrismaError } from 'src/shared/helpers'

@Injectable()
export class ProfileService {
  constructor(
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly hashingService: HashingService,
  ) {}

  async getProfile(userId: number) {
    const user = await this.sharedUserRepository.findUniqueIncludeRolePermission({
      id: userId,
      deletedAt: null,
    })

    if (!user) {
      throw NotFoundRecordException
    }

    return user
  }

  async updateProfile({ userId, body }: { userId: number; body: UpdateMeBodyType }) {
    try {
      return await this.sharedUserRepository.update(
        { id: userId, deletedAt: null },
        {
          ...body,
          updatedById: userId,
        },
      )
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }

  async changePassword({ userId, body }: { userId: number; body: ChangePasswordBodyType }) {
    try {
      const { password, newPassword } = body
      const user = await this.sharedUserRepository.findUnique({ id: userId, deletedAt: null })
      if (!user) {
        throw NotFoundRecordException
      }
      const isPasswordMath = await this.hashingService.compare(password, user.password)
      if (!isPasswordMath) {
        throw InvalidPasswordException
      }

      const hashedPassword = await this.hashingService.hash(newPassword)
      await this.sharedUserRepository.update(
        { id: userId, deletedAt: null },
        { password: hashedPassword, updatedById: userId },
      )
      return {
        message: 'Password change successfully',
      }
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }
}

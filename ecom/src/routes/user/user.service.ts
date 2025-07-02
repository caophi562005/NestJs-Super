import { ForbiddenException, Injectable } from '@nestjs/common'
import { UserRepository } from './user.repo'
import { HashingService } from 'src/shared/services/hashing.service'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { SharedRoleRepository } from 'src/shared/repositories/shared-role.repo'
import { CreateUserBodyType, GetUserParamsType, GetUserQueryType } from './user.model'
import { NotFoundRecordException } from 'src/shared/error'
import { RoleName } from 'src/shared/constants/role.constant'
import { isForeignKeyConstraintPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { RoleNotFoundException, UserAlreadyExistsException } from './user.error'

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashingService: HashingService,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly sharedRoleRepository: SharedRoleRepository,
  ) {}

  private async verifyRole({ roleNameAgent, roleIdTarget }) {
    if (roleNameAgent === RoleName.Admin) {
      return true
    } else {
      const adminRoleId = await this.sharedRoleRepository.getAdminRoleId()
      if (roleIdTarget === roleIdTarget) {
        throw new ForbiddenException()
      }
      return true
    }
  }

  list(pagination: GetUserQueryType) {
    return this.userRepository.list(pagination)
  }

  async findById(id: number) {
    const user = await this.sharedUserRepository.findUnique({
      id,
      deletedAt: null,
    })

    if (!user) {
      throw NotFoundRecordException
    }

    return user
  }

  async create({
    data,
    createdById,
    createdByRoleName,
  }: {
    data: CreateUserBodyType
    createdById: number
    createdByRoleName: string
  }) {
    try {
      //Kt có role có hợp lệ để thực hiện thao tác
      await this.verifyRole({
        roleNameAgent: createdByRoleName,
        roleIdTarget: data.roleId,
      })

      //hash password
      const hashedPassword = await this.hashingService.hash(data.password)

      const user = this.userRepository.create({
        createdById,
        data: {
          ...data,
          password: hashedPassword,
        },
      })

      return user
    } catch (error) {
      if (isForeignKeyConstraintPrismaError(error)) {
        throw RoleNotFoundException
      }

      if (isUniqueConstraintPrismaError(error)) {
        throw UserAlreadyExistsException
      }

      throw error
    }
  }
}

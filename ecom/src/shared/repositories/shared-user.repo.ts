import { Injectable } from '@nestjs/common'
import { PrismaService } from '../services/prisma.service'
import { UserType } from '../models/shared-user.model'
import { RoleType } from '../models/shared-role.model'
import { PermissionType } from '../models/shared-permission.model'

export type WhereUniqueUserType = { id: number } | { email: string }

type UserIncludeRolePermissionType = UserType & { role: RoleType & { permissions: PermissionType[] } }

@Injectable()
export class SharedUserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findUnique(where: WhereUniqueUserType): Promise<UserType | null> {
    return this.prismaService.user.findFirst({
      where: where,
    })
  }

  findUniqueIncludeRolePermission(where: WhereUniqueUserType): Promise<UserIncludeRolePermissionType | null> {
    return this.prismaService.user.findFirst({
      where: where,
      include: {
        role: {
          include: {
            permissions: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    })
  }

  update(where: { id: number }, data: Partial<UserType>): Promise<UserType | null> {
    return this.prismaService.user.update({
      where: {
        ...where,
        deletedAt: null,
      },
      data,
    })
  }
}

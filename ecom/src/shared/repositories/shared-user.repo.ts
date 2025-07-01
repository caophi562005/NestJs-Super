import { Injectable } from '@nestjs/common'
import { PrismaService } from '../services/prisma.service'
import { UserType } from '../models/shared-user.model'
import { RoleType } from '../models/shared-role.model'
import { PermissionType } from '../models/shared-permission.model'

export type WhereUniqueUserType = { id: number; [key: string]: any } | { email: string; [key: string]: any }

type UserIncludeRolePermissionType = UserType & { role: RoleType & { permissions: PermissionType[] } }

@Injectable()
export class SharedUserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findUnique(where: WhereUniqueUserType): Promise<UserType | null> {
    return this.prismaService.user.findUnique({
      where: where,
    })
  }

  findUniqueIncludeRolePermission(where: WhereUniqueUserType): Promise<UserIncludeRolePermissionType | null> {
    return this.prismaService.user.findUnique({
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

  update(where: WhereUniqueUserType, data: Partial<UserType>): Promise<UserType | null> {
    return this.prismaService.user.update({
      where,
      data,
    })
  }
}

import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  CreateRoleBodyType,
  CreateRoleResType,
  GetRolesQueryType,
  GetRolesResType,
  RoleType,
  RoleWithPermissionType,
  UpdateRoleBodyType,
} from './role.model'

@Injectable()
export class RoleRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async list(pagination: GetRolesQueryType): Promise<GetRolesResType> {
    const skip = (pagination.page - 1) * pagination.limit
    const take = pagination.limit
    const [totalItems, data] = await Promise.all([
      this.prismaService.role.count({
        where: {
          deletedAt: null,
        },
      }),
      this.prismaService.role.findMany({
        where: {
          deletedAt: null,
        },
        skip,
        take,
      }),
    ])
    return {
      page: pagination.page,
      limit: pagination.limit,
      totalItems,
      data,
      totalPages: Math.ceil(totalItems / pagination.limit),
    }
  }

  findById(id: number): Promise<RoleWithPermissionType | null> {
    return this.prismaService.role.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        permissions: true,
      },
    })
  }

  create({ createdById, data }: { createdById: number; data: CreateRoleBodyType }): Promise<CreateRoleResType> {
    return this.prismaService.role.create({
      data: {
        ...data,
        createdById,
      },
    })
  }

  update({ id, updatedById, data }: { id: number; updatedById: number; data: UpdateRoleBodyType }): Promise<RoleType> {
    return this.prismaService.role.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        permissions: {
          set: data.permissionIds.map((id) => ({ id })),
        },
        updatedById,
      },
      include: {
        permissions: true,
      },
    })
  }

  delete({ id, deletedById }: { id: number; deletedById: number }, isHard?: boolean): Promise<RoleType> {
    return isHard
      ? this.prismaService.role.delete({
          where: {
            id,
          },
        })
      : this.prismaService.role.update({
          where: {
            id,
            deletedAt: null,
          },
          data: {
            deletedById,
            deletedAt: new Date(),
          },
        })
  }
}

import { Injectable } from '@nestjs/common'
import { RoleName } from 'src/shared/constants/role.constant'
import { PrismaService } from 'src/shared/services/prisma.service'
import { RoleType } from './auth.model'

@Injectable()
export class RolesService {
  private clientRoleId: number | null = null

  constructor(private readonly prismaService: PrismaService) {}

  async getClientRoleId() {
    if (this.clientRoleId) {
      return this.clientRoleId
    }
    const role: RoleType = await this.prismaService.$queryRaw`
    SELECT * FROM "Role" WHERE "name" = ${RoleName.Client} AND "deletedAt" IS NULL
    `.then((res: RoleType[]) => {
      if (res.length === 0) {
        throw new Error('Role not found')
      }
      return res[0]
    })
    this.clientRoleId = role.id
    return role.id
  }
}

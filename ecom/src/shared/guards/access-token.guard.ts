import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common'
import { REQUEST_ROLE_PERMISSION, REQUEST_USER_KEY } from '../constants/auth.constant'
import { TokenService } from '../services/token.service'
import { AccessTokenPayload } from '../types/jwt.type'
import { PrismaService } from '../services/prisma.service'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { RoleWithPermissionType } from '../models/shared-role.model'
import { keyBy } from 'lodash'

type Permission = RoleWithPermissionType['permissions'][number]
type CachedRole = RoleWithPermissionType & {
  permissions: {
    [key: string]: Permission
  }
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private extractAccessTokenFromHeader(request: any): string {
    const accessToken = request.headers.authorization?.split(' ')[1]
    if (!accessToken) {
      throw new UnauthorizedException('Error.MissingAccessToken')
    }
    return accessToken
  }

  private async extractAndValidateToken(request: any): Promise<AccessTokenPayload> {
    const accessToken = this.extractAccessTokenFromHeader(request)
    try {
      const decodedAccessToken = await this.tokenService.verifyAccessToken(accessToken)
      request[REQUEST_USER_KEY] = decodedAccessToken
      return decodedAccessToken
    } catch (e) {
      throw new UnauthorizedException('Error.InvalidAccessToken')
    }
  }

  private async validateUserPermission(decodedAccessToken: AccessTokenPayload, request: any): Promise<void> {
    const roleId = decodedAccessToken.roleId
    const path = request.route.path
    const method = request.method
    const cacheKey = `role:${roleId}`

    //Thử lấy từ cache
    let cachedRole = await this.cacheManager.get<CachedRole>(cacheKey)
    if (!cachedRole) {
      const role = await this.prismaService.role
        .findUniqueOrThrow({
          where: {
            id: roleId,
            isActive: true,
            deletedAt: null,
          },
          include: {
            permissions: {
              where: {
                deletedAt: null,
              },
            },
          },
        })
        .catch(() => {
          throw new ForbiddenException()
        })

      const permissionObject = keyBy(
        role.permissions,
        (permission) => `${permission.path}:${permission.method}`,
      ) as CachedRole['permissions']

      cachedRole = { ...role, permissions: permissionObject }

      await this.cacheManager.set(cacheKey, cachedRole, 1000 * 60 * 60)
      request[REQUEST_ROLE_PERMISSION] = role
    }

    // Kiểm tra quyển truy cập
    const canAccess = cachedRole.permissions[`${path}:${method}`]
    if (!canAccess) {
      throw new ForbiddenException()
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    //Extract và validate token
    const decodedAccessToken = await this.extractAndValidateToken(request)

    //Check user permission
    await this.validateUserPermission(decodedAccessToken, request)

    return true
  }
}

import { ForbiddenException, UnauthorizedException } from '@nestjs/common'

export const RoleAlreadyExistsException = new UnauthorizedException([
  {
    message: 'Error.RoleAlreadyExists',
    path: 'path',
  },
  {
    message: 'Error.RoleAlreadyExists',
    path: 'method',
  },
])

export const ProhibitedActionOnBaseRoleException = new ForbiddenException('Error.ProhibitedActionOnBaseRole')

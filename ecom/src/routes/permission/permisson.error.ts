import { UnauthorizedException } from '@nestjs/common'

export const PermissionAlreadyExistsException = new UnauthorizedException([
  {
    message: 'Error.PermissionAlreadyExists',
    path: 'path',
  },
  {
    message: 'Error.PermissionAlreadyExists',
    path: 'method',
  },
])

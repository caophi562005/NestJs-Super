import { UnauthorizedException } from '@nestjs/common'

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

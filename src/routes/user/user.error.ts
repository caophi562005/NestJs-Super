import { ForbiddenException, UnauthorizedException } from '@nestjs/common'

export const UserAlreadyExistsException = new UnauthorizedException([
  {
    message: 'Error.UserAlreadyExists',
    path: 'email',
  },
])

export const CannotUpdateAdminUserException = new ForbiddenException('Error.CannotUpdateAdminUser')

export const CannotDeleteAdminUserException = new ForbiddenException('Error.CannotDeleteAdminUser')

export const CannotSetAdminRoleToUserException = new ForbiddenException('Error.CannotSetAdminRoleToUser')

export const RoleNotFoundException = new UnauthorizedException([
  {
    message: 'Error.RoleNotFound',
    path: 'roleId',
  },
])

export const CannotUpdateOrDeleteYourselfException = new ForbiddenException('Error.CannotUpdateOrDeleteYourself')

import { NotFoundException, UnauthorizedException } from '@nestjs/common'

export const NotFoundRecordException = new NotFoundException('Error.NotFound')

export const InvalidPasswordException = new UnauthorizedException([
  { message: 'Error.InvalidPassword', path: 'password' },
])

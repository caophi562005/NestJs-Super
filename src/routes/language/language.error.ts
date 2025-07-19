import { UnauthorizedException } from '@nestjs/common'

export const LanguageAlreadyExistsException = new UnauthorizedException([
  {
    message: 'Error.LanguageAlreadyExists',
    path: 'id',
  },
])

import { UnauthorizedException } from '@nestjs/common'

export const BrandTranslationAlreadyExistsException = new UnauthorizedException([
  {
    message: 'Error.BrandTranslationAlreadyExists',
    path: 'languageId',
  },
])

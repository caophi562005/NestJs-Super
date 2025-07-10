import { UnauthorizedException } from '@nestjs/common'

export const ProductTranslationAlreadyExistsException = new UnauthorizedException([
  {
    message: 'Error.ProductTranslationAlreadyExists',
    path: 'languageId',
  },
  {
    message: 'Error.ProductTranslationAlreadyExists',
    path: 'productId',
  },
])

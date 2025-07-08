import { UnauthorizedException } from '@nestjs/common'

export const CategoryTranslationAlreadyExistsException = new UnauthorizedException([
  {
    message: 'Error.CategoryTranslationAlreadyExists',
    path: 'languageId',
  },
  {
    message: 'Error.CategoryTranslationAlreadyExists',
    path: 'categoryId',
  },
])

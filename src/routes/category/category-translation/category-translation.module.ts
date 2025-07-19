import { Module } from '@nestjs/common'
import { CategoryTranslationController } from './category-translation.controller'
import { CategoryTranslationService } from './category-translation.service'
import { CategoryTranslationRepository } from './category-translation.repo'

@Module({
  controllers: [CategoryTranslationController],
  providers: [CategoryTranslationService, CategoryTranslationRepository],
})
export class CategoryTranslationModule {}

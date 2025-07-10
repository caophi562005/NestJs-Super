import { Module } from '@nestjs/common'
import { ProductTranslationController } from './product-translation.controller'
import { ProductTranslationService } from './product-translation.service'
import { ProductTranslationRepository } from './product-translation.repo'

@Module({
  controllers: [ProductTranslationController],
  providers: [ProductTranslationService, ProductTranslationRepository],
})
export class ProductTranslationModule {}

import { Module } from '@nestjs/common'
import { BrandTranslationController } from './brand-translation.controller'
import { BrandTranslationService } from './brand-translation.service'
import { BrandTranslationRepository } from './brand-translation.repo'

@Module({
  controllers: [BrandTranslationController],
  providers: [BrandTranslationService, BrandTranslationRepository],
})
export class BrandTranslationModule {}

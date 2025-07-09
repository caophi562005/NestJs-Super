import { Module } from '@nestjs/common';
import { ProductTranslationController } from './product-translation.controller';
import { ProductTranslationService } from './product-translation.service';

@Module({
  controllers: [ProductTranslationController],
  providers: [ProductTranslationService]
})
export class ProductTranslationModule {}

import { Module } from '@nestjs/common'
import { CartController } from './cart.controller'
import { CartService } from './cart.service'
import { CartRepository } from './cart.repo'

@Module({
  controllers: [CartController],
  providers: [CartService, CartRepository],
})
export class CartModule {}

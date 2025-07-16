import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { CartService } from './cart.service'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  AddToCartBodyDTO,
  CartItemDTO,
  DeleteCartBodyDTO,
  GetCartItemParamsDTO,
  GetCartResDTO,
  UpdateCartItemBodyDTO,
} from './cart.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { PaginationQueryDTO } from 'src/shared/dtos/request.dto'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ZodSerializerDto(GetCartResDTO)
  getCart(@ActiveUser('userId') userId: number, @Query() query: PaginationQueryDTO) {
    return this.cartService.getCart(userId, query)
  }

  @Post()
  @ZodSerializerDto(CartItemDTO)
  addToCart(@Body() body: AddToCartBodyDTO, @ActiveUser('userId') userId: number) {
    return this.cartService.addToCart(userId, body)
  }

  @Put(':cartItemId')
  @ZodSerializerDto(CartItemDTO)
  updateCartItem(
    @Body() body: UpdateCartItemBodyDTO,
    @Param() params: GetCartItemParamsDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.cartService.updateCartItem({
      cartItemId: params.cartItemId,
      body,
      userId: userId,
    })
  }

  @Post('delete')
  @ZodSerializerDto(MessageResDTO)
  deleteCart(@Body() body: DeleteCartBodyDTO, @ActiveUser('userId') userId: number) {
    return this.cartService.deleteCart(userId, body)
  }
}

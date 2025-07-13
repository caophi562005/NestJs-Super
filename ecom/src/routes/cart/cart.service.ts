import { Injectable } from '@nestjs/common'
import { CartRepository } from './cart.repo'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { I18nContext } from 'nestjs-i18n'
import { AddToCartBodyType, DeleteCartBodyType, UpdateCartItemBodyType } from './cart.model'

@Injectable()
export class CartService {
  constructor(private readonly cartRepository: CartRepository) {}

  getCart(userId: number, query: PaginationQueryType) {
    return this.cartRepository.list({ userId, languageId: I18nContext.current()?.lang as string, pagination: query })
  }

  addToCart(userId: number, body: AddToCartBodyType) {
    return this.cartRepository.create(userId, body)
  }

  updateCartItem(cartItemId: number, body: UpdateCartItemBodyType) {
    return this.cartRepository.update(cartItemId, body)
  }

  async deleteCart(userId: number, body: DeleteCartBodyType) {
    const { count } = await this.cartRepository.delete(userId, body)
    return {
      message: `${count} item(s) deleted from cart`,
    }
  }
}

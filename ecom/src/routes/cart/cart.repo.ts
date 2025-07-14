import { Injectable } from '@nestjs/common'
import { SKUType } from 'src/shared/models/shared-sku.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { NotFoundSKUException, OutOfStockSKUException, ProductNotFoundException } from './cart.error'
import {
  AddToCartBodyType,
  CartItemDetailResType,
  CartItemType,
  DeleteCartBodyType,
  GetCartResType,
  UpdateCartItemBodyType,
} from './cart.model'
import { ALL_LANGUAGE_CODE } from 'src/shared/constants/other.constant'
import { PaginationQueryType } from 'src/shared/models/request.model'

@Injectable()
export class CartRepository {
  constructor(private readonly prismaService: PrismaService) {}

  private async validateSKU(skuId: number, quantity: number): Promise<SKUType> {
    const sku = await this.prismaService.sKU.findUnique({
      where: {
        id: skuId,
        deletedAt: null,
      },
      include: {
        product: true,
      },
    })

    //Kiểm tra tồn tại của SKU
    if (!sku) {
      throw NotFoundSKUException
    }

    //Kiểm tra hàng tồn
    if (sku.stock < 1 || sku.stock < quantity) {
      throw OutOfStockSKUException
    }

    const { product } = sku

    //Kiểm tra xem sản phẩm bị xoá hay có publish không
    if (
      product.deletedAt !== null ||
      product.publishedAt === null ||
      (product.publishedAt !== null && product.publishedAt > new Date())
    ) {
      throw ProductNotFoundException
    }

    return sku
  }

  async list({
    pagination,
    userId,
    languageId,
  }: {
    pagination: PaginationQueryType
    userId: number
    languageId: string
  }): Promise<GetCartResType> {
    const cartItems = await this.prismaService.cartItem.findMany({
      where: {
        userId,
        sku: {
          product: {
            deletedAt: null,
            publishedAt: {
              lte: new Date(),
              not: null,
            },
          },
        },
      },
      include: {
        sku: {
          include: {
            product: {
              include: {
                productTranslations: {
                  where: languageId === ALL_LANGUAGE_CODE ? { deletedAt: null } : { languageId, deletedAt: null },
                },
                createdBy: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    const groupMap = new Map<number, CartItemDetailResType>()
    for (const cartItem of cartItems) {
      const shopId = cartItem.sku.product.createdById
      if (shopId) {
        if (!groupMap.has(shopId)) {
          groupMap.set(shopId, { shop: cartItem.sku.product.createdBy, cartItems: [] })
        }
        groupMap.get(shopId)?.cartItems.push(cartItem)
      }
    }
    const sortedGroups = Array.from(groupMap.values())

    const skip = (pagination.page - 1) * pagination.limit
    const take = pagination.limit

    const totalGroups = sortedGroups.length
    const pageGroups = sortedGroups.slice(skip, skip + take)

    return {
      data: pageGroups,
      page: pagination.page,
      limit: pagination.limit,
      totalItems: totalGroups,
      totalPages: Math.ceil(totalGroups / pagination.limit),
    }
  }

  async create(userId: number, body: AddToCartBodyType): Promise<CartItemType> {
    await this.validateSKU(body.skuId, body.quantity)
    return this.prismaService.cartItem.upsert({
      where: {
        userId_skuId: {
          userId,
          skuId: body.skuId,
        },
      },
      update: {
        quantity: {
          increment: body.quantity,
        },
      },
      create: {
        userId,
        ...body,
      },
    })
  }

  async update(cartItemId: number, body: UpdateCartItemBodyType): Promise<CartItemType> {
    await this.validateSKU(body.skuId, body.quantity)

    return this.prismaService.cartItem.update({
      where: {
        id: cartItemId,
      },
      data: body,
    })
  }

  delete(userId: number, body: DeleteCartBodyType): Promise<{ count: number }> {
    return this.prismaService.cartItem.deleteMany({
      where: {
        id: {
          in: body.cartItemIds,
        },
        userId,
      },
    })
  }
}

import { Injectable } from '@nestjs/common'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { CreateOrderBodyType, CreateOrderResType, GetOrderListQueryType, GetOrderListResType } from './order.model'
import { Prisma } from '@prisma/client'
import { OrderStatus, OrderStatusType } from 'src/shared/constants/order.constant'
import {
  NotFoundCartItemException,
  OutOfStockSKUException,
  ProductNotFoundException,
  SKUNotBelongToShopException,
} from './order.error'
import { language } from 'googleapis/build/src/apis/language'

@Injectable()
export class OrderRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async list({ userId, query }: { userId: number; query: GetOrderListQueryType }): Promise<GetOrderListResType> {
    const skip = (query.page - 1) * query.limit
    const take = query.limit

    const where: Prisma.OrderWhereInput = {
      userId,
      status: query.status,
    }

    const [totalItems, data] = await Promise.all([
      this.prismaService.order.count({
        where,
      }),
      this.prismaService.order.findMany({
        where,
        include: {
          items: true,
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ])

    return {
      data,
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / query.limit),
    }
  }

  async create({ userId, body }: { userId: number; body: CreateOrderBodyType }): Promise<CreateOrderResType> {
    // Kiểm tra xem các cartItemIds có tồn tại trong cơ sở dữ liệu
    const allBodyCartItemIds = body.map((item) => item.cartItemIds).flat()

    const cartItems = await this.prismaService.cartItem.findMany({
      where: {
        id: {
          in: allBodyCartItemIds,
        },
        userId,
      },
      include: {
        sku: {
          include: {
            product: {
              include: {
                productTranslations: true,
              },
            },
          },
        },
      },
    })

    if (cartItems.length !== allBodyCartItemIds.length) {
      throw NotFoundCartItemException
    }

    // Kiểm tra xem số lượng mua có lơn hơn tồn kho
    const isOutOfStock = cartItems.some((item) => {
      return item.sku.stock < item.quantity
    })

    if (isOutOfStock) {
      throw OutOfStockSKUException
    }

    // Kiểm tra xem tất cả sản phẩm mua , có sản phẩm nào bị xoá hay ẩn k
    const isExistNotReadyProduct = cartItems.some(
      (item) =>
        item.sku.product.deletedAt !== null ||
        item.sku.product.publishedAt === null ||
        item.sku.product.publishedAt > new Date(),
    )

    if (isExistNotReadyProduct) {
      throw ProductNotFoundException
    }

    // Kiểm tra xem các skuId trong cartItems có thuộc về shopId gửi lên không
    const cartItemMap = new Map<number, (typeof cartItems)[0]>()
    cartItems.forEach((item) => {
      cartItemMap.set(item.id, item)
    })
    const isValidShop = body.every((item) => {
      const bodyCartItemIds = item.cartItemIds
      return bodyCartItemIds.every((cartItemId) => {
        const cartItem = cartItemMap.get(cartItemId)!
        return item.shopId === cartItem.sku.createdById
      })
    })
    if (!isValidShop) {
      throw SKUNotBelongToShopException
    }

    // Tạo order và xoá cartItem
    const orders = await this.prismaService.$transaction(async (tx) => {
      const orders = await Promise.all(
        body.map((item) =>
          tx.order.create({
            data: {
              userId,
              status: OrderStatus.PENDING_PAYMENT,
              receiver: item.receiver,
              createdById: userId,
              shopId: item.shopId,
              items: {
                create: item.cartItemIds.map((cartItemId) => {
                  const cartItem = cartItemMap.get(cartItemId)!
                  return {
                    productName: cartItem.sku.product.name,
                    skuPrice: cartItem.sku.price,
                    image: cartItem.sku.image,
                    skuId: cartItem.skuId,
                    skuValue: cartItem.sku.value,
                    quantity: cartItem.quantity,
                    productId: cartItem.sku.productId,
                    productTranslation: cartItem.sku.product.productTranslations.map((translation) => {
                      return {
                        id: translation.id,
                        name: translation.name,
                        description: translation.description,
                        languageId: translation.languageId,
                      }
                    }),
                  }
                }),
              },
              products: {
                connect: item.cartItemIds.map((cartItemId) => {
                  const cartItem = cartItemMap.get(cartItemId)!
                  return {
                    id: cartItem.sku.product.id,
                  }
                }),
              },
            },
          }),
        ),
      )
      await tx.cartItem.deleteMany({
        where: {
          id: {
            in: allBodyCartItemIds,
          },
        },
      })
      return orders
    })
    return {
      data: orders,
    }
  }
}

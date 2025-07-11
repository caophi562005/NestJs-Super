import { Injectable } from '@nestjs/common'
import { SKUType } from 'src/shared/models/shared-sku.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { NotFoundSKUException, OutOfStockSKUException, ProductNotFoundException } from './cart.error'
import {
  AddToCartBodyType,
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

  private async validateSKU(skuId: number): Promise<SKUType> {
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
    if (sku.stock < 1) {
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

  async findAll({
    pagination,
    userId,
    languageId,
  }: {
    pagination: PaginationQueryType
    userId: number
    languageId: string
  }): Promise<GetCartResType> {
    const skip = (pagination.page - 1) * pagination.limit
    const take = pagination.limit
    const [totalItems, data] = await Promise.all([
      this.prismaService.cartItem.count({
        where: {
          userId,
        },
      }),
      this.prismaService.cartItem.findMany({
        where: {
          userId,
        },
        include: {
          sku: {
            include: {
              product: {
                include: {
                  productTranslations: {
                    where: languageId === ALL_LANGUAGE_CODE ? { deletedAt: null } : { languageId, deletedAt: null },
                  },
                },
              },
            },
          },
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
      page: pagination.page,
      limit: pagination.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / pagination.limit),
    }
  }

  async create(userId: number, body: AddToCartBodyType): Promise<CartItemType> {
    await this.validateSKU(body.skuId)
    return this.prismaService.cartItem.create({
      data: {
        userId,
        ...body,
      },
    })
  }

  async update(cartItemId: number, body: UpdateCartItemBodyType): Promise<CartItemType> {
    await this.validateSKU(body.skuId)

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

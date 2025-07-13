import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  CreateProductBodyType,
  GetProductDetailResType,
  GetProductsResType,
  UpdateProductBodyType,
} from './product.model'
import { ALL_LANGUAGE_CODE, OrderByType, SortBy, SortByType } from 'src/shared/constants/other.constant'
import { Prisma } from '@prisma/client'
import { ProductType } from 'src/shared/models/shared-product.model'

@Injectable()
export class ProductRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async list({
    limit,
    page,
    name,
    brandIds,
    categories,
    minPrice,
    maxPrice,
    createdById,
    isPublish,
    languageId,
    orderBy,
    sortBy,
  }: {
    limit: number
    page: number
    name?: string
    brandIds?: number[]
    categories?: number[]
    minPrice?: number
    maxPrice?: number
    createdById?: number
    isPublish?: boolean
    languageId: string
    orderBy: OrderByType
    sortBy: SortByType
  }): Promise<GetProductsResType> {
    const skip = (page - 1) * limit
    const take = limit
    let where: Prisma.ProductWhereInput = {
      deletedAt: null,
      createdById: createdById ? createdById : undefined,
    }

    if (isPublish === true) {
      where.publishedAt = {
        lte: new Date(),
        not: null,
      }
    } else if (isPublish === false) {
      where = {
        ...where,
        OR: [{ publishedAt: null }, { publishedAt: { gt: new Date() } }],
      }
    }

    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive',
      }
    }

    if (brandIds && brandIds.length > 0) {
      where.brandId = {
        in: brandIds,
      }
    }

    if (categories && categories.length > 0) {
      where.categories = {
        some: {
          id: {
            in: categories,
          },
        },
      }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {
        gte: minPrice,
        lte: maxPrice,
      }
    }
    // Mắc định sort theo createdAt mới nhất
    let calculatedOrderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = {
      createdAt: orderBy,
    }

    if (sortBy === SortBy.Price) {
      calculatedOrderBy = {
        basePrice: orderBy,
      }
    } else if (sortBy === SortBy.Sale) {
      calculatedOrderBy = {
        orders: {
          _count: orderBy,
        },
      }
    }

    const [totalItems, data] = await Promise.all([
      this.prismaService.product.count({
        where,
      }),
      this.prismaService.product.findMany({
        where,
        include: {
          productTranslations: {
            where: languageId === ALL_LANGUAGE_CODE ? { deletedAt: null } : { languageId: languageId, deletedAt: null },
          },
          orders: {
            where: {
              deletedAt: null,
              status: 'DELIVERED',
            },
          },
        },
        orderBy: calculatedOrderBy,
        skip,
        take,
      }),
    ])
    return {
      data,
      totalItems,
      page: page,
      limit: limit,
      totalPages: Math.ceil(totalItems / limit),
    }
  }

  getDetail({
    productId,
    languageId,
    isPublish,
  }: {
    productId: number
    languageId: string
    isPublish?: boolean
  }): Promise<GetProductDetailResType | null> {
    let where: Prisma.ProductWhereUniqueInput = {
      id: productId,
      deletedAt: null,
    }

    if (isPublish === true) {
      where.publishedAt = {
        lte: new Date(),
        not: null,
      }
    } else if (isPublish === false) {
      where = {
        ...where,
        OR: [{ publishedAt: null }, { publishedAt: { gt: new Date() } }],
      }
    }
    return this.prismaService.product.findUnique({
      where,
      include: {
        productTranslations: {
          where: languageId === ALL_LANGUAGE_CODE ? { deletedAt: null } : { languageId: languageId, deletedAt: null },
        },
        skus: {
          where: {
            deletedAt: null,
          },
        },
        brand: {
          include: {
            brandTranslations: {
              where:
                languageId === ALL_LANGUAGE_CODE ? { deletedAt: null } : { languageId: languageId, deletedAt: null },
            },
          },
        },
        categories: {
          where: {
            deletedAt: null,
          },
          include: {
            categoryTranslations: {
              where:
                languageId === ALL_LANGUAGE_CODE ? { deletedAt: null } : { languageId: languageId, deletedAt: null },
            },
          },
        },
      },
    })
  }

  findById(productId: number): Promise<ProductType | null> {
    return this.prismaService.product.findUnique({
      where: {
        id: productId,
        deletedAt: null,
      },
    })
  }

  create({
    createdById,
    data,
  }: {
    createdById: number
    data: CreateProductBodyType
  }): Promise<GetProductDetailResType> {
    const { skus, categories, ...productData } = data
    return this.prismaService.product.create({
      data: {
        ...productData,
        createdById,
        categories: {
          connect: categories.map((category) => ({ id: category })),
        },
        skus: {
          createMany: {
            data: skus.map((sku) => ({
              ...sku,
              createdById,
            })),
          },
        },
      },
      include: {
        productTranslations: {
          where: {
            deletedAt: null,
          },
        },
        brand: {
          include: {
            brandTranslations: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
        categories: {
          where: {
            deletedAt: null,
          },
          include: {
            categoryTranslations: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
        skus: {
          where: {
            deletedAt: null,
          },
        },
      },
    })
  }

  async update({
    id,
    updatedById,
    data,
  }: {
    id: number
    updatedById: number
    data: UpdateProductBodyType
  }): Promise<ProductType> {
    const { skus: dataSkus, categories, ...productData } = data
    //SKU tồn tại trong DB nhưng không có trong data payload thì sẽ bị xoá

    //Lấy danh sách SKU hiện tại trong DB
    const existingSkus = await this.prismaService.sKU.findMany({
      where: {
        productId: id,
        deletedAt: null,
      },
    })

    //Tìm các SKU cần xoá ( tồn tại trong DB nhưng không có trong data payload)
    const skusToDelete = existingSkus.filter((sku) => dataSkus.every((dataSku) => dataSku.value !== sku.value))
    const skuIdsToDelete = skusToDelete.map((sku) => sku.id)

    // Đưa các ID của sku tồn tại trong DB vào data payload
    const skuWithId = dataSkus.map((dataSku) => {
      const existingSku = existingSkus.find((eSkus) => eSkus.value === dataSku.value)
      return {
        ...dataSku,
        id: existingSku ? existingSku.id : null,
      }
    })

    // Tìm các Sku để cập nhập
    const skusToUpdate = skuWithId.filter((dataSku) => dataSku.id !== null)

    // Tìm các Sku cần thêm mới
    const skusToCreate = skuWithId
      .filter((dataSku) => dataSku.id === null)
      .map((sku) => {
        const { id: skuId, ...data } = sku
        return {
          ...data,
          productId: id,
          createdById: updatedById,
        }
      })

    const [product] = await this.prismaService.$transaction([
      // Cập nhập product
      this.prismaService.product.update({
        where: {
          id,
          deletedAt: null,
        },
        data: {
          ...productData,
          updatedById,
          categories: {
            connect: categories.map((category) => ({ id: category })),
          },
        },
      }),

      // Xoá mềm các SKU không có trong data payload
      this.prismaService.sKU.updateMany({
        where: {
          id: {
            in: skuIdsToDelete,
          },
        },
        data: {
          deletedById: updatedById,
          deletedAt: new Date(),
        },
      }),

      // Cập nhập các SKU
      ...skusToUpdate.map((sku) => {
        return this.prismaService.sKU.update({
          where: {
            id: sku.id as number,
          },
          data: {
            value: sku.value,
            price: sku.price,
            stock: sku.stock,
            image: sku.image,
            updatedById,
          },
        })
      }),

      // Thêm mới SKU
      this.prismaService.sKU.createMany({
        data: skusToCreate,
      }),
    ])

    return product
  }

  async delete({ id, deletedById }: { id: number; deletedById: number }, isHard?: boolean): Promise<ProductType> {
    if (isHard) {
      return this.prismaService.product.delete({
        where: {
          id,
        },
      })
    } else {
      const [product] = await Promise.all([
        this.prismaService.product.update({
          where: {
            id,
            deletedAt: null,
          },
          data: {
            deletedById,
            deletedAt: new Date(),
          },
        }),
        this.prismaService.productTranslation.updateMany({
          where: {
            productId: id,
            deletedAt: null,
          },
          data: {
            deletedById,
            deletedAt: new Date(),
          },
        }),
        this.prismaService.sKU.updateMany({
          where: {
            productId: id,
            deletedAt: null,
          },
          data: {
            deletedById,
            deletedAt: new Date(),
          },
        }),
      ])
      return product
    }
  }
}

import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  CreateProductBodyType,
  GetProductDetailResType,
  GetProductsQueryType,
  GetProductsResType,
  ProductType,
  UpdateProductBodyType,
} from './product.model'
import { ALL_LANGUAGE_CODE } from 'src/shared/constants/other.constant'

@Injectable()
export class ProductRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async list(query: GetProductsQueryType, languageId: string): Promise<GetProductsResType> {
    const skip = (query.page - 1) * query.limit
    const take = query.limit
    const [totalItems, data] = await Promise.all([
      this.prismaService.product.count({
        where: {
          deletedAt: null,
        },
      }),
      this.prismaService.product.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          productTranslations: {
            where: languageId === ALL_LANGUAGE_CODE ? { deletedAt: null } : { languageId: languageId, deletedAt: null },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
    ])
    return {
      data,
      totalItems,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(totalItems / query.limit),
    }
  }

  findById(id: number, languageId: string): Promise<GetProductDetailResType | null> {
    return this.prismaService.product.findUnique({
      where: {
        id,
        deletedAt: null,
      },
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
            data: skus,
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
      const [product] = await Promise.all([
        this.prismaService.product.delete({
          where: {
            id,
          },
        }),
        this.prismaService.sKU.deleteMany({
          where: {
            productId: id,
          },
        }),
      ])
      return product
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

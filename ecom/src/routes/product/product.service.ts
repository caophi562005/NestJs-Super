import { Injectable } from '@nestjs/common'
import { ProductRepository } from './product.repo'
import { CreateProductBodyType, GetProductsQueryType, UpdateProductBodyType } from './product.model'
import { I18nContext } from 'nestjs-i18n'
import { NotFoundRecordException } from 'src/shared/error'
import { isNotFoundPrismaError } from 'src/shared/helpers'

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async list(query: GetProductsQueryType) {
    const data = await this.productRepository.list(query, I18nContext.current()?.lang as string)
    return data
  }

  async findById(id: number) {
    const product = await this.productRepository.findById(id, I18nContext.current()?.lang as string)
    if (!product) {
      throw NotFoundRecordException
    }
    return product
  }

  create({ data, createdById }: { data: CreateProductBodyType; createdById: number }) {
    return this.productRepository.create({
      createdById,
      data,
    })
  }

  async update({ id, data, updatedById }: { id: number; data: UpdateProductBodyType; updatedById: number }) {
    try {
      const product = await this.productRepository.update({
        id,
        data,
        updatedById,
      })
      return product
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }

  async delete({ id, deletedById }: { id: number; deletedById: number }) {
    try {
      await this.productRepository.delete({ id, deletedById })
      return {
        message: 'Delete Successfully',
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }

      throw error
    }
  }
}

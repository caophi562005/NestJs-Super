import { Injectable } from '@nestjs/common'
import { ProductRepository } from './product.repo'
import { GetProductsQueryType } from './product.model'
import { I18nContext } from 'nestjs-i18n'
import { NotFoundRecordException } from 'src/shared/error'

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async list(query: GetProductsQueryType) {
    const data = await this.productRepository.list({
      ...query,
      isPublish: true,
      languageId: I18nContext.current()?.lang as string,
    })
    return data
  }

  async getDetail(productId: number) {
    const product = await this.productRepository.getDetail({
      productId,
      languageId: I18nContext.current()?.lang as string,
      isPublish: true,
    })
    if (!product) {
      throw NotFoundRecordException
    }
    return product
  }
}

import { createZodDto } from 'nestjs-zod'
import {
  CreateProductBodySchema,
  GetManageProductsQuerySchema,
  GetProductDetailResSchema,
  GetProductsParamsSchema,
  GetProductsQuerySchema,
  GetProductsResSchema,
  updateProductBodySchema,
} from './product.model'
import { ProductSchema } from 'src/shared/models/shared-product.model'

export class ProductDTO extends createZodDto(ProductSchema) {}

export class GetProductsResDTO extends createZodDto(GetProductsResSchema) {}

export class GetProductDetailResDTO extends createZodDto(GetProductDetailResSchema) {}

export class GetProductsParamsDTO extends createZodDto(GetProductsParamsSchema) {}

export class GetProductsQueryDTO extends createZodDto(GetProductsQuerySchema) {}

export class GetManageProductsQueryDTO extends createZodDto(GetManageProductsQuerySchema) {}

export class CreateProductBodyDTO extends createZodDto(CreateProductBodySchema) {}

export class UpdateProductBodyDTO extends createZodDto(updateProductBodySchema) {}

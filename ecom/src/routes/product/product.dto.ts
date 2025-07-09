import { createZodDto } from 'nestjs-zod'
import {
  CreateProductBodySchema,
  GetProductDetailResSchema,
  GetProductsParamsSchema,
  GetProductsQuerySchema,
  GetProductsResSchema,
  updateProductBodySchema,
} from './product.model'

export class GetProductsResDTO extends createZodDto(GetProductsResSchema) {}

export class GetProductDetailResDTO extends createZodDto(GetProductDetailResSchema) {}

export class GetProductsParamsDTO extends createZodDto(GetProductsParamsSchema) {}

export class GetProductsQueryDTO extends createZodDto(GetProductsQuerySchema) {}

export class CreateProductBodyDTO extends createZodDto(CreateProductBodySchema) {}

export class UpdateProductBodyDTO extends createZodDto(updateProductBodySchema) {}

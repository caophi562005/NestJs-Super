import { Controller, Get, Param, Query } from '@nestjs/common'
import { ProductService } from './product.service'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { ZodSerializerDto } from 'nestjs-zod'
import { GetProductDetailResDTO, GetProductsParamsDTO, GetProductsQueryDTO, GetProductsResDTO } from './product.dto'
import { SkipThrottle } from '@nestjs/throttler'

@SkipThrottle()
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @IsPublic()
  @ZodSerializerDto(GetProductsResDTO)
  list(@Query() query: GetProductsQueryDTO) {
    return this.productService.list(query)
  }

  @SkipThrottle({ default: false })
  @Get(':productId')
  @IsPublic()
  @ZodSerializerDto(GetProductDetailResDTO)
  findById(@Param() params: GetProductsParamsDTO) {
    return this.productService.getDetail(params.productId)
  }
}

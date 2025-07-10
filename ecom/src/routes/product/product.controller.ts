import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ProductService } from './product.service'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateProductBodyDTO,
  GetProductDetailResDTO,
  GetProductsParamsDTO,
  GetProductsQueryDTO,
  GetProductsResDTO,
  UpdateProductBodyDTO,
} from './product.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @IsPublic()
  @ZodSerializerDto(GetProductsResDTO)
  list(@Query() query: GetProductsQueryDTO) {
    return this.productService.list(query)
  }

  @Get(':productId')
  @IsPublic()
  @ZodSerializerDto(GetProductDetailResDTO)
  findById(@Param() params: GetProductsParamsDTO) {
    return this.productService.findById(params.productId)
  }

  @Post()
  @ZodSerializerDto(GetProductDetailResDTO)
  create(@Body() body: CreateProductBodyDTO, @ActiveUser('userId') userId: number) {
    return this.productService.create({
      data: body,
      createdById: userId,
    })
  }

  @Put(':productId')
  @ZodSerializerDto(GetProductDetailResDTO)
  update(
    @Body() body: UpdateProductBodyDTO,
    @Param() params: GetProductsParamsDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.productService.update({
      id: params.productId,
      data: body,
      updatedById: userId,
    })
  }

  @Delete(':productId')
  @ZodSerializerDto(MessageResDTO)
  delete(@Param() params: GetProductsParamsDTO, @ActiveUser('userId') userId: number) {
    return this.productService.delete({
      id: params.productId,
      deletedById: userId,
    })
  }
}

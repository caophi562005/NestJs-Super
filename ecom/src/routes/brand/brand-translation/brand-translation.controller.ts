import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { BrandTranslationService } from './brand-translation.service'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateBrandTranslationBodyDTO,
  GetBrandTranslationDetailResDTO,
  GetBrandTranslationParamsDTO,
  UpdateBrandTranslationBodyDTO,
} from './brand-translation.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('brand-translation')
export class BrandTranslationController {
  constructor(private readonly brandTranslationService: BrandTranslationService) {}

  @Get(':brandTranslationId')
  @ZodSerializerDto(GetBrandTranslationDetailResDTO)
  findById(@Param() params: GetBrandTranslationParamsDTO) {
    return this.brandTranslationService.findById(params.brandTranslationId)
  }

  @Post()
  @ZodSerializerDto(GetBrandTranslationDetailResDTO)
  create(@Body() body: CreateBrandTranslationBodyDTO, @ActiveUser('userId') userId: number) {
    return this.brandTranslationService.create({
      data: body,
      createdById: userId,
    })
  }

  @Put(':brandTranslationId')
  @ZodSerializerDto(GetBrandTranslationDetailResDTO)
  update(
    @Body() body: UpdateBrandTranslationBodyDTO,
    @Param() params: GetBrandTranslationParamsDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.brandTranslationService.update({
      id: params.brandTranslationId,
      data: body,
      updatedById: userId,
    })
  }

  @Delete(':brandTranslationId')
  @ZodSerializerDto(MessageResDTO)
  delete(@Param() params: GetBrandTranslationParamsDTO, @ActiveUser('userId') userId) {
    return this.brandTranslationService.delete({
      id: params.brandTranslationId,
      deletedById: userId,
    })
  }
}

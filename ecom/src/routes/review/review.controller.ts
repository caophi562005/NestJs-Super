import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ReviewService } from './review.service'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateReviewBodyDTO,
  CreateReviewResDTO,
  GetReviewDetailParamsDTO,
  GetReviewsDTO,
  GetReviewsParamsDTO,
  UpdateReviewBodyDTO,
  UpdateReviewResDTO,
} from './review.dto'
import { PaginationQueryDTO } from 'src/shared/dtos/request.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { IsPublic } from 'src/shared/decorators/auth.decorator'

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('/products/:productId')
  @IsPublic()
  @ZodSerializerDto(GetReviewsDTO)
  getReviews(@Param() params: GetReviewsParamsDTO, @Query() query: PaginationQueryDTO) {
    return this.reviewService.list(params.productId, query)
  }

  @Post()
  @ZodSerializerDto(CreateReviewResDTO)
  createReview(@Body() body: CreateReviewBodyDTO, @ActiveUser('userId') userId: number) {
    return this.reviewService.create(userId, body)
  }

  @Put(':reviewId')
  @ZodSerializerDto(UpdateReviewResDTO)
  updateReview(
    @Body() body: UpdateReviewBodyDTO,
    @Param() params: GetReviewDetailParamsDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.reviewService.update(userId, params.reviewId, body)
  }
}

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'

export const OrderNotFoundException = new NotFoundException('Error.OrderNotFound')

export const NotDeliveredOrderException = new BadRequestException('Error.NotDeliveredOrder')

export const ReviewNotFoundException = new NotFoundException('Error.ReviewNotFound')

export const UpdateReviewOnceException = new BadRequestException('Error.UpdateReviewOnce')

export const AlreadyReviewProductException = new ConflictException('Error.AlreadyReviewProduct')

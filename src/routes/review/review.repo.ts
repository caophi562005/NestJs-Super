import { Injectable } from '@nestjs/common'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  CreateReviewBodyType,
  CreateReviewResType,
  GetReviewsType,
  UpdateReviewBodyType,
  UpdateReviewResType,
} from './review.model'
import {
  AlreadyReviewProductException,
  NotDeliveredOrderException,
  OrderNotFoundException,
  ReviewNotFoundException,
  UpdateReviewOnceException,
} from './review.error'
import { OrderStatus } from 'src/shared/constants/order.constant'
import { isUniqueConstraintPrismaError } from 'src/shared/helpers'

@Injectable()
export class ReviewRepository {
  constructor(private readonly prismaService: PrismaService) {}

  private async validateOrder({ orderId, userId }: { orderId: number; userId: number }) {
    const order = await this.prismaService.order.findUnique({
      where: {
        id: orderId,
        userId,
      },
    })

    if (!order) {
      throw OrderNotFoundException
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw NotDeliveredOrderException
    }

    return order
  }

  private async validateUpdateReview({ reviewId, userId }: { reviewId: number; userId: number }) {
    const review = await this.prismaService.review.findUnique({
      where: {
        id: reviewId,
        userId,
      },
    })

    if (!review) {
      throw ReviewNotFoundException
    }

    if (review.updateCount >= 1) {
      throw UpdateReviewOnceException
    }

    return review
  }

  async list(productId: number, pagination: PaginationQueryType): Promise<GetReviewsType> {
    const skip = (pagination.page - 1) * pagination.limit
    const take = pagination.limit

    const [totalItems, data] = await Promise.all([
      this.prismaService.review.count({
        where: {
          productId,
        },
      }),
      this.prismaService.review.findMany({
        where: {
          productId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          medias: true,
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ])

    return {
      data,
      totalItems,
      totalPages: Math.ceil(totalItems / pagination.limit),
      page: pagination.page,
      limit: pagination.limit,
    }
  }

  async create({ userId, body }: { userId: number; body: CreateReviewBodyType }): Promise<CreateReviewResType> {
    const { content, medias, productId, orderId, rating } = body
    await this.validateOrder({
      orderId,
      userId,
    })

    return this.prismaService.$transaction(async (tx) => {
      const review = await tx.review
        .create({
          data: {
            content,
            rating,
            productId,
            orderId,
            userId,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        })
        .catch((error) => {
          if (isUniqueConstraintPrismaError(error)) {
            throw AlreadyReviewProductException
          }

          throw error
        })

      const reviewMedias = await tx.reviewMedia.createManyAndReturn({
        data: medias.map((media) => ({
          url: media.url,
          type: media.type,
          reviewId: review.id,
        })),
      })

      return {
        ...review,
        medias: reviewMedias,
      }
    })
  }

  async update({
    userId,
    reviewId,
    body,
  }: {
    userId: number
    reviewId: number
    body: UpdateReviewBodyType
  }): Promise<UpdateReviewResType> {
    const { content, medias, productId, orderId, rating } = body

    await Promise.all([
      this.validateOrder({
        orderId,
        userId,
      }),
      this.validateUpdateReview({
        reviewId,
        userId,
      }),
    ])

    return this.prismaService.$transaction(async (tx) => {
      const review = await tx.review.update({
        where: {
          id: reviewId,
        },
        data: {
          content,
          rating,
          productId,
          orderId,
          userId,
          updateCount: {
            increment: 1,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      })

      await tx.reviewMedia.deleteMany({
        where: {
          reviewId,
        },
      })

      const reviewMedias = await tx.reviewMedia.createManyAndReturn({
        data: medias.map((media) => ({
          url: media.url,
          type: media.type,
          reviewId: review.id,
        })),
      })

      return {
        ...review,
        medias: reviewMedias,
      }
    })
  }
}

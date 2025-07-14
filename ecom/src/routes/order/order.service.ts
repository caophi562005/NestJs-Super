import { Injectable } from '@nestjs/common'
import { OrderRepository } from './order.repo'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { OrderStatusType } from 'src/shared/constants/order.constant'
import { CreateOrderBodyType, GetOrderListQueryType } from './order.model'

@Injectable()
export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  list({ userId, query }: { userId: number; query: GetOrderListQueryType }) {
    return this.orderRepository.list({
      query,
      userId,
    })
  }

  create({ userId, body }: { userId: number; body: CreateOrderBodyType }) {
    return this.orderRepository.create({
      body,
      userId,
    })
  }
}

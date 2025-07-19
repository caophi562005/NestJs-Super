import { Injectable } from '@nestjs/common'
import { OrderRepository } from './order.repo'
import { CreateOrderBodyType, GetOrderListQueryType } from './order.model'
import { OrderProducer } from './order.producer'

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderProducer: OrderProducer,
  ) {}

  list({ userId, query }: { userId: number; query: GetOrderListQueryType }) {
    return this.orderRepository.list({
      query,
      userId,
    })
  }

  async create({ userId, body }: { userId: number; body: CreateOrderBodyType }) {
    const result = await this.orderRepository.create({
      body,
      userId,
    })
    return result
  }

  detail({ userId, orderId }: { userId: number; orderId: number }) {
    return this.orderRepository.detail({
      orderId,
      userId,
    })
  }

  cancel({ userId, orderId }: { userId: number; orderId: number }) {
    return this.orderRepository.cancel({
      orderId,
      userId,
    })
  }
}

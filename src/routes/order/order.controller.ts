import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { OrderService } from './order.service'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CancelOrderResDTO,
  CreateOrderBodyDTO,
  CreateOrderResDTO,
  GetOrderDetailResDTO,
  GetOrderListQueryDTO,
  GetOrderListResDTO,
  GetOrderParamsDTO,
} from './order.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ZodSerializerDto(GetOrderListResDTO)
  getOrder(@ActiveUser('userId') userId: number, @Query() query: GetOrderListQueryDTO) {
    return this.orderService.list({ userId, query })
  }

  @Post()
  @ZodSerializerDto(CreateOrderResDTO)
  createOrder(@ActiveUser('userId') userId: number, @Body() body: CreateOrderBodyDTO) {
    return this.orderService.create({ userId, body })
  }

  @Get(':orderId')
  @ZodSerializerDto(GetOrderDetailResDTO)
  detail(@ActiveUser('userId') userId: number, @Param() params: GetOrderParamsDTO) {
    return this.orderService.detail({ userId, orderId: params.orderId })
  }

  @Put(':orderId')
  @ZodSerializerDto(CancelOrderResDTO)
  cancel(@ActiveUser('userId') userId: number, @Param() params: GetOrderParamsDTO) {
    return this.orderService.cancel({ userId, orderId: params.orderId })
  }
}

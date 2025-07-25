import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { WebhookPaymentBodyType } from './payment.model'
import { MessageResType } from 'src/shared/models/response.model'
import { parse } from 'date-fns'
import { PREFIX_PAYMENT_CODE } from 'src/shared/constants/other.constant'
import { OrderInProductSKUSnapshotType } from 'src/shared/models/shared-order.model'
import { PaymentStatus } from 'src/shared/constants/payment.constant'
import { OrderStatus } from 'src/shared/constants/order.constant'
import { PaymentProducer } from './payment.producer'

@Injectable()
export class PaymentRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly paymentProducer: PaymentProducer,
  ) {}

  private getTotalPrice(orders: OrderInProductSKUSnapshotType[]) {
    return orders.reduce((total, order) => {
      const orderTotal = order.items.reduce((totalPrice, productSKU) => {
        return totalPrice + productSKU.skuPrice * productSKU.quantity
      }, 0)
      return total + orderTotal
    }, 0)
  }

  async receiver(body: WebhookPaymentBodyType): Promise<number> {
    // Thêm thông tin giao dịch vào DB
    let amountIn = 0
    let amountOut = 0
    if (body.transferType === 'in') {
      amountIn = body.transferAmount
    } else if (body.transferType === 'out') {
      amountOut = body.transferAmount
    }

    const paymentTransaction = await this.prismaService.paymentTransaction.findUnique({
      where: {
        id: body.id,
      },
    })

    if (paymentTransaction) {
      throw new BadRequestException('Payment transaction already exists')
    }
    const userId = await this.prismaService.$transaction(async (tx) => {
      await tx.paymentTransaction.create({
        data: {
          id: body.id,
          gateway: body.gateway,
          transactionDate: parse(body.transactionDate, 'yyyy-MM-dd HH:mm:ss', new Date()),
          accountNumber: body.accountNumber,
          subAccount: body.subAccount,
          amountIn,
          amountOut,
          accumulated: body.accumulated,
          code: body.code,
          transactionContent: body.content,
          referenceNumber: body.referenceCode,
          body: body.description,
        },
      })

      // Kiểm tra nội dung chuyển tiền và tổng số tiền có khớp không
      const paymentId = body.code
        ? Number(body.code.split(PREFIX_PAYMENT_CODE)[1])
        : Number(body.content?.split(PREFIX_PAYMENT_CODE)[1])

      if (isNaN(paymentId)) {
        throw new BadRequestException('Cannot get paymentId from content')
      }

      const payment = await tx.payment.findUnique({
        where: {
          id: paymentId,
        },
        include: {
          orders: {
            include: {
              items: true,
            },
          },
        },
      })

      if (!payment) {
        throw new BadRequestException(`Cannot find payment with id ${paymentId}`)
      }

      const userId = payment.orders[0].userId

      const { orders } = payment
      const totalPrice = this.getTotalPrice(orders)
      if (totalPrice !== body.transferAmount) {
        throw new BadRequestException(`Total price ${totalPrice} does not match transfer amount ${body.transferAmount}`)
      }

      // Cập nhập trạng thái đơn hàng

      await Promise.all([
        tx.payment.update({
          where: {
            id: paymentId,
          },
          data: {
            status: PaymentStatus.SUCCESS,
          },
        }),
        tx.order.updateMany({
          where: {
            id: {
              in: orders.map((order) => order.id),
            },
          },
          data: {
            status: OrderStatus.PENDING_PICKUP,
          },
        }),
        this.paymentProducer.removeJob(paymentId),
      ])
      return userId
    })

    return userId
  }
}

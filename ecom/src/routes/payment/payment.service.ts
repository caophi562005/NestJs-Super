import { Injectable } from '@nestjs/common'
import { PaymentRepository } from './payment.repo'
import { WebhookPaymentBodyType } from './payment.model'
import { SharedWebsocketRepository } from 'src/shared/repositories/shared-websocket.repo'
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'socket.io'

@Injectable()
@WebSocketGateway({ namespace: 'payment' })
export class PaymentService {
  @WebSocketServer()
  server: Server

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly sharedWebsocketRepository: SharedWebsocketRepository,
  ) {}

  async receiver(body: WebhookPaymentBodyType) {
    const userId = await this.paymentRepository.receiver(body)
    try {
      const websockets = await this.sharedWebsocketRepository.findMany(userId)
      websockets.forEach((ws) => {
        this.server.to(ws.id).emit('payment', {
          status: 'success',
        })
      })
    } catch (error) {
      console.log(error)
    }
    return {
      message: 'Payment success',
    }
  }
}

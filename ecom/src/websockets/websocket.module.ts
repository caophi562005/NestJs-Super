import { Module } from '@nestjs/common'
import { ChatGateway } from './chat.gateway'
import { PaymentGateway } from './payment.gateway'

@Module({
  providers: [ChatGateway, PaymentGateway],
})
export class WebsocketModule {}

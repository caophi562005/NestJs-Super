import { Injectable } from '@nestjs/common'
import { PaymentRepository } from './payment.repo'
import { WebhookPaymentBodyType } from './payment.model'

@Injectable()
export class PaymentService {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  receiver(body: WebhookPaymentBodyType) {
    return this.paymentRepository.receiver(body)
  }
}

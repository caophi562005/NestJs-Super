import { Body, Controller, Post } from '@nestjs/common'
import { PaymentService } from './payment.service'
import { ZodSerializerDto } from 'nestjs-zod'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { WebhookPaymentBodyDTO } from './payment.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'
import { AuthType } from 'src/shared/constants/auth.constant'
import { ApiSecurity } from '@nestjs/swagger'

@Controller('payment')
@ApiSecurity('payment-api-key')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/receiver')
  @ZodSerializerDto(MessageResDTO)
  @Auth([AuthType.PaymentAPIKey])
  receiver(@Body() body: WebhookPaymentBodyDTO) {
    return this.paymentService.receiver(body)
  }
}

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import envConfig from '../config'

@Injectable()
export class PaymentAPIKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const xAPIKey = request.headers['payment-api-key']
    if (xAPIKey !== envConfig.PAYMENT_API_KEY) {
      throw new UnauthorizedException()
    }

    return true
  }
}

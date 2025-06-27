import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import React from 'react'
import envConfig from '../config'
import OTPEmail from 'emails/otp'

@Injectable()
export class EmailService {
  private resend: Resend
  constructor() {
    this.resend = new Resend(envConfig.RESEND_API_KEY)
  }

  sendOTP(payload: { email: string; code: string }) {
    return this.resend.emails.send({
      from: 'Phi <no-reply@hacmieu.xyz>',
      to: [payload.email],
      subject: 'Mã OTP',
      react: <OTPEmail code={payload.code} />,
    })
  }
}

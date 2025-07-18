import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class RemoveRefreshTokenCornJob {
  constructor(private readonly prismaService: PrismaService) {}

  private readonly logger = new Logger(RemoveRefreshTokenCornJob.name)

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleCron() {
    this.logger.debug('Xoá refreshToken hết hạn')
    await this.prismaService.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })
  }
}

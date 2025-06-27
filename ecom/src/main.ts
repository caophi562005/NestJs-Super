import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  //Cho phép tất cả origin ( tạm thời )
  app.enableCors()
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()

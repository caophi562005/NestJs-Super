import { INestApplicationContext } from '@nestjs/common'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'
import { ServerOptions, Server, Socket } from 'socket.io'
import envConfig from 'src/shared/config'
import { generateRoomUserId } from 'src/shared/helpers'
import { TokenService } from 'src/shared/services/token.service'

export class WebsocketAdapter extends IoAdapter {
  private readonly tokenService: TokenService
  private adapterConstructor: ReturnType<typeof createAdapter>

  constructor(app: INestApplicationContext) {
    super(app)
    this.tokenService = app.get(TokenService)
  }

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: envConfig.REDIS_URL })
    const subClient = pubClient.duplicate()

    await Promise.all([pubClient.connect(), subClient.connect()])

    this.adapterConstructor = createAdapter(pubClient, subClient)
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server: Server = super.createIOServer(3003, {
      ...options,
      cors: {
        origin: '*',
        credentials: true,
      },
    })

    server.use((socket, next) => {
      this.authMiddleware(socket, next)
    })
    server.of(/.*/).use((socket, next) => {
      this.authMiddleware(socket, next)
    })
    return server
  }

  async authMiddleware(socket: Socket, next: (err?: any) => void) {
    const { authorization } = socket.handshake.headers
    if (!authorization) {
      return next(new Error('Thiếu Authentication'))
    }

    const accessToken = authorization.split(' ')[1]

    try {
      const { userId } = await this.tokenService.verifyAccessToken(accessToken)
      // await this.sharedWebsocketRepository.create({
      //   id: socket.id,
      //   userId,
      // })
      // socket.on('disconnect', async () => {
      //   await this.sharedWebsocketRepository.delete(socket.id)
      // })
      await socket.join(generateRoomUserId(userId))
      next()
    } catch (error) {
      next(error)
    }
    next()
  }
}

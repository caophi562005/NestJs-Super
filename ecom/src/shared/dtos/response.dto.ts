import { createZodDto } from 'nestjs-zod'
import { MessageResSchema } from '../models/response.modal'

export class MessageResDTO extends createZodDto(MessageResSchema) {}

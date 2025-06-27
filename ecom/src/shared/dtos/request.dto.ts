import { createZodDto } from 'nestjs-zod'
import { EmptyBodySchema } from '../models/request.modal'

export class EmptyBodyDTO extends createZodDto(EmptyBodySchema) {}

import { createZodDto } from 'nestjs-zod'
import { EmptyBodySchema, PaginationQuerySchema } from '../models/request.model'

export class EmptyBodyDTO extends createZodDto(EmptyBodySchema) {}

export class PaginationQueryDTO extends createZodDto(PaginationQuerySchema) {}

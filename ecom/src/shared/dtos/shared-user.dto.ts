import { createZodDto } from 'nestjs-zod'
import { GetUserProfileResSchema, UpdatProfileResSchema } from '../models/shared-user.model'

export class GetUserProfileResDTO extends createZodDto(GetUserProfileResSchema) {}

export class UpdateProfileResDTO extends createZodDto(UpdatProfileResSchema) {}

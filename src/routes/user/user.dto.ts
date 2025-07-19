import { createZodDto } from 'nestjs-zod'
import {
  CreateUserBodySchema,
  GetUserParamsSchema,
  GetUserQuerySchema,
  GetUserResSchema,
  UpdateUserBodySchema,
} from './user.model'
import { UpdateProfileResDTO } from 'src/shared/dtos/shared-user.dto'

export class GetUserResDTO extends createZodDto(GetUserResSchema) {}

export class GetUserQueryDTO extends createZodDto(GetUserQuerySchema) {}

export class GetUserParamsDTO extends createZodDto(GetUserParamsSchema) {}

export class CreateUserBodyDTO extends createZodDto(CreateUserBodySchema) {}

export class UpdateUserBodyDTO extends createZodDto(UpdateUserBodySchema) {}

export class CreateUserResDTO extends UpdateProfileResDTO {}

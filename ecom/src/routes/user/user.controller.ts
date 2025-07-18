import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { UserService } from './user.service'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateUserBodyDTO,
  CreateUserResDTO,
  GetUserParamsDTO,
  GetUserQueryDTO,
  GetUserResDTO,
  UpdateUserBodyDTO,
} from './user.dto'
import { GetUserProfileResDTO, UpdateProfileResDTO } from 'src/shared/dtos/shared-user.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { ActiveRolePermission } from 'src/shared/decorators/active-role-permission.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { ApiBearerAuth } from '@nestjs/swagger'

@Controller('users')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ZodSerializerDto(GetUserResDTO)
  list(@Query() query: GetUserQueryDTO) {
    return this.userService.list({
      page: query.page,
      limit: query.limit,
    })
  }

  @Get(':userId')
  @ZodSerializerDto(GetUserProfileResDTO)
  findById(@Param() params: GetUserParamsDTO) {
    return this.userService.findById(params.userId)
  }

  @Post()
  @ZodSerializerDto(CreateUserResDTO)
  create(
    @Body() body: CreateUserBodyDTO,
    @ActiveUser('userId') userId: number,
    @ActiveRolePermission('name') roleName: string,
  ) {
    return this.userService.create({
      data: body,
      createdById: userId,
      createdByRoleName: roleName,
    })
  }

  @Put(':userId')
  @ZodSerializerDto(UpdateProfileResDTO)
  update(
    @Body() body: UpdateUserBodyDTO,
    @Param() params: GetUserParamsDTO,
    @ActiveUser('userId') userId: number,
    @ActiveRolePermission('name') roleName: string,
  ) {
    return this.userService.update({
      data: body,
      id: params.userId,
      updatedById: userId,
      updatedByRoleName: roleName,
    })
  }

  @Delete(':userId')
  @ZodSerializerDto(MessageResDTO)
  delete(
    @Param() params: GetUserParamsDTO,
    @ActiveUser('userId') userId: number,
    @ActiveRolePermission('name') roleName: string,
  ) {
    return this.userService.delete({
      id: params.userId,
      deletedById: userId,
      deletedByRoleName: roleName,
    })
  }
}

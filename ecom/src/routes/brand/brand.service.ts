import { Injectable } from '@nestjs/common'
import { BrandRepository } from './brand.repo'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { NotFoundRecordException } from 'src/shared/error'
import { CreateBrandBodyType, UpdateBrandBodyType } from './brand.model'
import { isNotFoundPrismaError } from 'src/shared/helpers'

@Injectable()
export class BrandService {
  constructor(private readonly brandRepository: BrandRepository) {}

  list(pagination: PaginationQueryType) {
    return this.brandRepository.list(pagination)
  }

  async findById(id: number) {
    const brand = await this.brandRepository.findById(id)
    if (!brand) {
      throw NotFoundRecordException
    }
    return brand
  }

  create({ data, createdById }: { data: CreateBrandBodyType; createdById: number }) {
    return this.brandRepository.create({
      data,
      createdById,
    })
  }

  update({ id, data, updatedById }: { id: number; data: UpdateBrandBodyType; updatedById: number }) {
    try {
      return this.brandRepository.update({
        id,
        data,
        updatedById,
      })
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }

  async delete({ id, deletedById }: { id: number; deletedById: number }) {
    try {
      await this.brandRepository.delete({ id, deletedById })
      return {
        message: 'Delete Successfully',
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }
}

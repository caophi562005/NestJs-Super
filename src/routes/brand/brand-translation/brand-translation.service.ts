import { Injectable } from '@nestjs/common'
import { BrandTranslationRepository } from './brand-translation.repo'
import { NotFoundRecordException } from 'src/shared/error'
import { error } from 'console'
import { CreateBrandTranslationBodyType, UpdateBrandTranslationBodyType } from './brand-translation.model'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { BrandTranslationAlreadyExistsException } from './brand-translation.error'

@Injectable()
export class BrandTranslationService {
  constructor(private readonly brandTranslationRepository: BrandTranslationRepository) {}

  async findById(id: number) {
    const brand = await this.brandTranslationRepository.findById(id)
    if (!brand) {
      throw NotFoundRecordException
    }
    return brand
  }

  create({ createdById, data }: { createdById: number; data: CreateBrandTranslationBodyType }) {
    try {
      return this.brandTranslationRepository.create({ createdById, data })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw BrandTranslationAlreadyExistsException
      }
      throw error
    }
  }

  update({ id, updatedById, data }: { id: number; updatedById: number; data: UpdateBrandTranslationBodyType }) {
    try {
      return this.brandTranslationRepository.update({
        id,
        updatedById,
        data,
      })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw BrandTranslationAlreadyExistsException
      }

      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }

      throw error
    }
  }

  async delete({ id, deletedById }: { id: number; deletedById: number }, isHard?: boolean) {
    try {
      await this.brandTranslationRepository.delete({ id, deletedById })
      return {
        message: 'Brand translation deleted successfully',
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }
}

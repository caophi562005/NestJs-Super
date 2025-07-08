import { Injectable } from '@nestjs/common'
import { CategoryTranslationRepository } from './category-translation.repo'
import { NotFoundRecordException } from 'src/shared/error'
import { CreateCategoryTranslationBodyType, UpdateCategoryTranslationBodyType } from './category-translation.model'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { CategoryTranslationAlreadyExistsException } from './category-translation.error'

@Injectable()
export class CategoryTranslationService {
  constructor(private readonly categoryTranslationRepository: CategoryTranslationRepository) {}

  async findById(id: number) {
    const category = await this.categoryTranslationRepository.findById(id)
    if (!category) {
      throw NotFoundRecordException
    }
    return category
  }

  async create({ createdById, data }: { createdById: number; data: CreateCategoryTranslationBodyType }) {
    try {
      return await this.categoryTranslationRepository.create({ createdById, data })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw CategoryTranslationAlreadyExistsException
      }
      throw error
    }
  }

  async update({
    id,
    updatedById,
    data,
  }: {
    id: number
    updatedById: number
    data: UpdateCategoryTranslationBodyType
  }) {
    try {
      return await this.categoryTranslationRepository.update({
        id,
        updatedById,
        data,
      })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw CategoryTranslationAlreadyExistsException
      }

      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }

      throw error
    }
  }

  async delete({ id, deletedById }: { id: number; deletedById: number }, isHard?: boolean) {
    try {
      await this.categoryTranslationRepository.delete({ id, deletedById })
      return {
        message: 'Category translation deleted successfully',
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }
}

import { Injectable } from '@nestjs/common'
import { CategoryRepository } from './category.repo'
import { CreateCategoryBodyType, GetAllCategoriesQueryType, UpdateCategoryBodyType } from './category.model'
import { I18nContext } from 'nestjs-i18n'
import { NotFoundRecordException } from 'src/shared/error'
import { isNotFoundPrismaError } from 'src/shared/helpers'

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  findAll(query: GetAllCategoriesQueryType) {
    return this.categoryRepository.findAll({
      parentCategoryId: query.parentCategoryId,
      languageId: I18nContext.current()?.lang as string,
    })
  }

  async findById(id: number) {
    const category = await this.categoryRepository.findById({
      id,
      languageId: I18nContext.current()?.lang as string,
    })
    if (!category) {
      throw NotFoundRecordException
    }
    return category
  }

  create({ data, createdById }: { data: CreateCategoryBodyType; createdById: number }) {
    return this.categoryRepository.create({
      data,
      createdById,
    })
  }

  update({ id, data, updatedById }: { id: number; data: UpdateCategoryBodyType; updatedById: number }) {
    try {
      return this.categoryRepository.update({
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
      await this.categoryRepository.delete({ id, deletedById })
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

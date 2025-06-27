import { Injectable } from '@nestjs/common'
import { LanguageRepository } from './language.repo'
import { CreateLanguageBodyType, UpdateLanguageBodyType } from './language.model'
import { NotFoundRecordException } from 'src/shared/error'
import { isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { LanguageAlreadyExistsException } from './language.error'

@Injectable()
export class LanguageService {
  constructor(private languageRepository: LanguageRepository) {}

  async findAll() {
    const data = await this.languageRepository.findAll()
    return {
      data,
      totalItems: data.length,
    }
  }

  async findById(id: string) {
    const language = await this.languageRepository.findById(id)
    if (!language) {
      throw NotFoundRecordException
    }
    return language
  }

  async create({ data, createdById }: { data: CreateLanguageBodyType; createdById: number }) {
    try {
      return await this.languageRepository.create({ data, createdById })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw LanguageAlreadyExistsException
      }

      throw error
    }
  }

  async update({ id, data, updatedById }: { id: string; data: UpdateLanguageBodyType; updatedById: number }) {
    try {
      const language = this.languageRepository.update({ id, data, updatedById })
      return language
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw LanguageAlreadyExistsException
      }

      throw error
    }
  }

  async delete(id: string) {
    try {
      //hard delete
      await this.languageRepository.delete(id, true)
      return {
        message: 'Delete successfully',
      }
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw LanguageAlreadyExistsException
      }

      throw error
    }
  }
}

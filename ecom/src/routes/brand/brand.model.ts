import { z } from 'zod'
import { BrandIncludeTranslationSchema, BrandSchema } from 'src/shared/models/shared-brand.model'

export const GetBrandResSchema = z.object({
  data: z.array(BrandIncludeTranslationSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const GetBrandParamsSchema = z
  .object({
    brandId: z.coerce.number().int().positive(),
  })
  .strict()

export const GetBrandDetailResSchema = BrandIncludeTranslationSchema

export const CreateBrandBodySchema = BrandSchema.pick({
  name: true,
  logo: true,
}).strict()

export const UpdateBrandBodySchema = CreateBrandBodySchema

export type BrandType = z.infer<typeof BrandSchema>
export type BrandIncludeTranslationType = z.infer<typeof BrandIncludeTranslationSchema>
export type GetBrandResType = z.infer<typeof GetBrandResSchema>
export type GetBrandParamsType = z.infer<typeof GetBrandParamsSchema>
export type GetBrandDetailResType = z.infer<typeof GetBrandDetailResSchema>
export type CreateBrandBodyType = z.infer<typeof CreateBrandBodySchema>
export type UpdateBrandBodyType = z.infer<typeof UpdateBrandBodySchema>

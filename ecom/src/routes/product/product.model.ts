import { PaginationQuerySchema } from 'src/shared/models/request.model'
import { z } from 'zod'
import { SKUSchema, UpsertSKUBodySchema } from './sku.model'
import { ProductTranslationSchema } from './product-translation/product-translation.model'
import { CategoryIncludeTranslationSchema } from 'src/shared/models/shared-category.model'
import { BrandIncludeTranslationSchema } from 'src/shared/models/shared-brand.model'

function generateSKUs(variants: any[]): any[] {
  function getCombinations(arrays: string[][]): string[] {
    return arrays.reduce((acc, curr) => acc.flatMap((x) => curr.map((y) => `${x}${x ? '-' : ''}${y}`)), [''])
  }

  const options = variants.map((variant) => variant.options)

  const combinations = getCombinations(options)

  return combinations.map((value) => ({
    value,
    price: 0,
    stock: 100,
    image: '',
  }))
}

export const VariantSchema = z.object({
  value: z.string(),
  options: z.array(z.string()),
})

export const VariantsSchema = z.array(VariantSchema).superRefine((variants, ctx) => {
  //Kiểm tra variants và variant option có bị trùng không
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i]
    const isDifferent = variants.findIndex((v) => v.value === variant.value) !== i
    if (!isDifferent) {
      return ctx.addIssue({
        code: 'custom',
        message: `Giá trị ${variant.value} đã tồn tại trong danh sách variants`,
        path: ['variants'],
      })
    }

    const isDifferentOption = variant.options.findIndex((o) => variant.options.includes(o)) !== -1
    if (!isDifferentOption) {
      return ctx.addIssue({
        code: 'custom',
        message: `Variant ${variant.value} chứa các option trùng`,
        path: ['variants'],
      })
    }
  }
})

export const ProductSchema = z.object({
  id: z.number(),
  publishedAt: z.coerce.date().nullable(),
  name: z.string().max(500),
  basePrice: z.number().positive(),
  virtualPrice: z.number().positive(),
  brandId: z.number().positive(),
  images: z.array(z.string()),
  variants: VariantsSchema,

  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
})

export const GetProductsQuerySchema = PaginationQuerySchema.extend({
  name: z.string().optional(),
  brandIds: z.array(z.coerce.number().int().positive().optional()),
  categories: z.array(z.coerce.number().int().positive().optional()),
  minPrice: z.coerce.number().int().positive().optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
})

export const GetProductsResSchema = z.object({
  data: z.array(
    ProductSchema.extend({
      productTranslations: z.array(ProductTranslationSchema),
    }),
  ),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const GetProductsParamsSchema = z
  .object({
    productId: z.coerce.number().int().positive(),
  })
  .strict()

export const GetProductDetailResSchema = ProductSchema.extend({
  productTranslations: z.array(ProductTranslationSchema),
  skus: z.array(SKUSchema),
  categories: z.array(CategoryIncludeTranslationSchema),
  brand: BrandIncludeTranslationSchema,
})

export const CreateProductBodySchema = ProductSchema.pick({
  publishedAt: true,
  name: true,
  basePrice: true,
  virtualPrice: true,
  brandId: true,
  images: true,
  variants: true,
})
  .extend({
    categories: z.array(z.coerce.number().int().positive()),
    skus: z.array(UpsertSKUBodySchema),
  })
  .strict()
  .superRefine(({ variants, skus }, ctx) => {
    //Kiểm tra xem số lượng SKU có hợp lệ không
    const skuValueArray = generateSKUs(variants)
    if (skus.length !== skuValueArray.length) {
      return ctx.addIssue({
        code: 'custom',
        message: `Số lượng SKU không hợp lệ`,
        path: ['skus'],
      })
    }

    // Kiểm tra từng SKU có hợp lệ không
    let wrongSKUIndex = -1
    const isValidSKUs = skus.every((sku, index) => {
      const isValid = sku.value === skuValueArray[index].value
      if (!isValid) {
        wrongSKUIndex = index
      }
      return isValid
    })
    if (!isValidSKUs) {
      ctx.addIssue({
        code: 'custom',
        message: `Giá trị SKU index ${wrongSKUIndex} không hợp lệ`,
        path: ['skus'],
      })
    }
  })

export const updateProductBodySchema = CreateProductBodySchema

export type ProductType = z.infer<typeof ProductSchema>
export type GetProductsQueryType = z.infer<typeof GetProductsQuerySchema>
export type GetProductsResType = z.infer<typeof GetProductsResSchema>
export type GetProductsParamsType = z.infer<typeof GetProductsParamsSchema>
export type GetProductDetailResType = z.infer<typeof GetProductDetailResSchema>
export type CreateProductBodyType = z.infer<typeof CreateProductBodySchema>
export type UpdateProductBodyType = z.infer<typeof updateProductBodySchema>
export type VariantType = z.infer<typeof VariantSchema>
export type VariantsType = z.infer<typeof VariantsSchema>

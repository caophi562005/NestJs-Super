import { VariantsType } from './shared/models/shared-product.model'

declare global {
  namespace PrismaJson {
    type Variants = VariantsType
  }
}

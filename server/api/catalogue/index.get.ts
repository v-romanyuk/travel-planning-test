import { getCatalogueStatus } from '~~/server/controllers/catalogue/getCatalogueStatus'
import { CatalogueStatusResSchema } from '~~/shared/schemas/catalogue/CatalogueStatusResSchema'

export default defineEventHandler(async () => {
  const status = await getCatalogueStatus()

  return CatalogueStatusResSchema.parse(status)
})

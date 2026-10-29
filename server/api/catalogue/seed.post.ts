import { seedCatalogue } from '~~/server/controllers/catalogue/seedCatalogue'
import { CatalogueStatusResSchema } from '~~/shared/schemas/catalogue/CatalogueStatusResSchema'

// Off unless NUXT_CATALOGUE_SEED_ENABLED=true; any signed-in user may press it when it's on
export default defineEventHandler(async () => {
  const status = await seedCatalogue()

  return CatalogueStatusResSchema.parse(status)
})

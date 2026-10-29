import { buildCatalogue } from './buildCatalogue/buildCatalogue'
import { getCatalogueStatus } from './getCatalogueStatus'

import { buildRepos } from '~~/server/repos'
import { InsertCatalogueEntrySchema } from '~~/server/types/catalogue/InsertCatalogueEntry'
import { createUserError } from '~~/server/utils/errorUtils'

// 500 rows × 9 columns stays far below Postgres' 65,535 bind parameters per statement
const BATCH_SIZE = 500

/**
 * Upserts the fixture catalogue by ref. Idempotent: the build is deterministic, and rows are overwritten, never
 * deleted — trip items reference catalogue rows, so existing plans keep their sources.
 */
export const seedCatalogue = async () => {
  if (!useRuntimeConfig().catalogueSeedEnabled) {
    throw createUserError({ statusCode: 403, message: 'Seeding the catalogue is turned off for this app.' })
  }

  const entries = InsertCatalogueEntrySchema.array().parse(buildCatalogue())

  await useDrizzle().transaction(async (tx) => {
    const txRepos = buildRepos(tx)
    for (let start = 0; start < entries.length; start += BATCH_SIZE) {
      // Sequential on purpose: one transaction runs one statement at a time
      await txRepos.catalogueEntriesRepo.upsertCatalogueEntries(entries.slice(start, start + BATCH_SIZE))
    }
  })
  console.info('[catalogue] seeded', entries.length)

  return getCatalogueStatus()
}

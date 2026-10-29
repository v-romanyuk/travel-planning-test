import { and, asc, count, eq, inArray, sql } from 'drizzle-orm'

import { catalogueEntriesTable } from '~~/server/services/drizzle/schema'
import { CatalogueEntrySchema } from '~~/server/types/catalogue/CatalogueEntry'
import type { ICatalogueEntriesRepo } from '~~/server/types/repos/ICatalogueEntriesRepo'
import type { TDrizzle } from '~~/server/utils/drizzle'

export const catalogueEntriesRepo = (db: TDrizzle): ICatalogueEntriesRepo => ({
  async findCatalogueEntriesByCities (cityIds, kind) {
    if (cityIds.length === 0) return []

    const rows = await db
      .select()
      .from(catalogueEntriesTable)
      .where(and(
        inArray(catalogueEntriesTable.cityId, cityIds),
        kind ? eq(catalogueEntriesTable.kind, kind) : undefined
      ))
      .orderBy(asc(catalogueEntriesTable.ref))

    return CatalogueEntrySchema.array().parse(rows)
  },

  async findCatalogueEntriesByRefs (refs) {
    if (refs.length === 0) return []

    const rows = await db
      .select()
      .from(catalogueEntriesTable)
      .where(inArray(catalogueEntriesTable.ref, refs))

    return CatalogueEntrySchema.array().parse(rows)
  },

  async countCatalogueEntries () {
    const [row] = await db.select({ value: count() }).from(catalogueEntriesTable)

    return row?.value ?? 0
  },

  async upsertCatalogueEntries (entries) {
    if (entries.length === 0) return 0

    const rows = await db
      .insert(catalogueEntriesTable)
      .values(entries)
      .onConflictDoUpdate({
        target: catalogueEntriesTable.ref,
        set: {
          kind: sql`excluded.kind`,
          cityId: sql`excluded.city_id`,
          cityName: sql`excluded.city_name`,
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          priceAmount: sql`excluded.price_amount`,
          priceCurrency: sql`excluded.price_currency`,
          priceUnit: sql`excluded.price_unit`,
          attributes: sql`excluded.attributes`
        }
      })
      .returning({ id: catalogueEntriesTable.id })

    return rows.length
  }
})

import type { TCatalogueEntry } from '~~/server/types/catalogue/CatalogueEntry'
import type { TInsertCatalogueEntry } from '~~/server/types/catalogue/InsertCatalogueEntry'
import type { EItemKind } from '~~/shared/schemas/trips/ItemKind'

export interface ICatalogueEntriesRepo {
  findCatalogueEntriesByCities: (cityIds: number[], kind?: EItemKind) => Promise<TCatalogueEntry[]>
  findCatalogueEntriesByRefs: (refs: string[]) => Promise<TCatalogueEntry[]>
  countCatalogueEntries: () => Promise<number>
  // Insert, or overwrite the row with the same ref; returns the rows written
  upsertCatalogueEntries: (entries: TInsertCatalogueEntry[]) => Promise<number>
}

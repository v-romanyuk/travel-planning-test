import { z } from 'zod'

import { CatalogueEntrySchema } from '~~/server/types/catalogue/CatalogueEntry'

const [transport, stay, place] = CatalogueEntrySchema.options

export const InsertCatalogueEntrySchema = z.discriminatedUnion('kind', [
  transport.omit({ id: true }),
  stay.omit({ id: true }),
  place.omit({ id: true })
])

export type TInsertCatalogueEntry = z.infer<typeof InsertCatalogueEntrySchema>

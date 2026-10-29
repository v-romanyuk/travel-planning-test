import { z } from 'zod'

import { EItemKind } from '~~/shared/schemas/trips/ItemKind'

export const SearchCatalogueInputSchema = z.object({
  kind: z.enum(EItemKind),
  cityId: z.int().describe('GeoNames id of the city; for transport, the departure city'),
  toCityId: z.int().optional().describe('transport only: GeoNames id of the arrival city')
})

export type TSearchCatalogueInput = z.infer<typeof SearchCatalogueInputSchema>

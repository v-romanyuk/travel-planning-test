import { z } from 'zod'

import { PlaceAttributesSchema } from '~~/server/types/catalogue/PlaceAttributes'
import { StayAttributesSchema } from '~~/server/types/catalogue/StayAttributes'
import { TransportAttributesSchema } from '~~/server/types/catalogue/TransportAttributes'
import { EPriceUnit } from '~~/shared/schemas/catalogue/PriceUnit'
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'

const base = {
  id: z.uuid(),
  ref: z.string(),
  cityId: z.int(),
  cityName: z.string(),
  name: z.string(),
  description: z.string(),
  priceAmount: z.number().nullable(),
  priceCurrency: z.string().length(3).nullable(),
  priceUnit: z.enum(EPriceUnit).nullable()
}

export const CatalogueEntrySchema = z.discriminatedUnion('kind', [
  z.object({ ...base, kind: z.literal(EItemKind.TRANSPORT), attributes: TransportAttributesSchema }),
  z.object({ ...base, kind: z.literal(EItemKind.STAY), attributes: StayAttributesSchema }),
  z.object({ ...base, kind: z.literal(EItemKind.PLACE), attributes: PlaceAttributesSchema })
])

export type TCatalogueEntry = z.infer<typeof CatalogueEntrySchema>

import { z } from 'zod'

import { ClockTimeSchema } from '~~/shared/schemas/catalogue/ClockTimeSchema'
import { ETransportMode } from '~~/shared/schemas/catalogue/TransportMode'

export const TransportAttributesSchema = z.object({
  mode: z.enum(ETransportMode),
  toCityId: z.int(),
  toCityName: z.string(),
  fromCountry: z.string().length(2),
  toCountry: z.string().length(2),
  international: z.boolean(),
  departs: ClockTimeSchema,
  arrives: ClockTimeSchema,
  arrivesNextDay: z.boolean(),
  stops: z.int().min(0),
  operator: z.string()
})

export type TTransportAttributes = z.infer<typeof TransportAttributesSchema>

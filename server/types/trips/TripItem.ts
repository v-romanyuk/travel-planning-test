import { z } from 'zod'

import { CitedFactSchema } from '~~/shared/schemas/trips/CitedFactSchema'
import { TransportDetailsSchema } from '~~/shared/schemas/trips/TransportDetailsSchema'
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'

export const TripItemSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  dayId: z.uuid(),
  position: z.int(),
  kind: z.enum(EItemKind),
  catalogueEntryId: z.uuid(),
  source: z.string(),
  name: z.string(),
  time: z.string(),
  endTime: z.string().nullable(),
  priceAmount: z.number().nullable(),
  priceCurrency: z.string().nullable(),
  priceUnit: z.string().nullable(),
  transport: TransportDetailsSchema.nullable(),
  why: z.string(),
  citedFacts: z.array(CitedFactSchema),
  status: z.literal('planned'),
  note: z.string().nullable(),
  removedAt: z.date().nullable()
})

export type TTripItem = z.infer<typeof TripItemSchema>

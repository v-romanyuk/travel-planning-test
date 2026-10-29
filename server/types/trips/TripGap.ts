import { z } from 'zod'

import { CitedFactSchema } from '~~/shared/schemas/trips/CitedFactSchema'
import { EGapReason } from '~~/shared/schemas/trips/GapReason'
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'

export const TripGapSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  date: z.iso.date().nullable(),
  kind: z.enum(EItemKind),
  reason: z.enum(EGapReason),
  facts: z.array(CitedFactSchema)
})

export type TTripGap = z.infer<typeof TripGapSchema>

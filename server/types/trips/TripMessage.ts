import { z } from 'zod'

import { EMessageAuthor } from '~~/shared/schemas/trips/MessageAuthor'
import { EMessageKind } from '~~/shared/schemas/trips/MessageKind'

export const TripMessageSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  author: z.enum(EMessageAuthor),
  kind: z.enum(EMessageKind),
  body: z.string(),
  createdAt: z.date()
})

export type TTripMessage = z.infer<typeof TripMessageSchema>

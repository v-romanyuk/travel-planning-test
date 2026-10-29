import { z } from 'zod'

import { EUnmetReason } from '~~/shared/schemas/trips/UnmetReason'

// A wish from the traveller's notes the plan doesn't follow; `request` is their own words, checked against the notes
export const UnmetRequestSchema = z.object({
  request: z.string(),
  reason: z.enum(EUnmetReason)
})

export type TUnmetRequest = z.infer<typeof UnmetRequestSchema>

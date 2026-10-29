import { z } from 'zod'

import { EPreferenceDomain } from '~~/shared/schemas/knowledge-graph/PreferenceDomain'
import { EPreferenceKind } from '~~/shared/schemas/knowledge-graph/PreferenceKind'

export const UnverifiedFactSchema = z.object({
  id: z.uuid(),
  kind: z.enum(EPreferenceKind),
  value: z.string(),
  // Optional: snapshots taken before they were added don't have them
  domain: z.enum(EPreferenceDomain).optional(),
  subjectName: z.string().optional()
})

export type TUnverifiedFact = z.infer<typeof UnverifiedFactSchema>

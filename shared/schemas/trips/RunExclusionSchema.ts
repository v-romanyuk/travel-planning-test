import { z } from 'zod'

import { EPreferenceDomain } from '~~/shared/schemas/knowledge-graph/PreferenceDomain'
import { EPreferenceKind } from '~~/shared/schemas/knowledge-graph/PreferenceKind'

export const RunExclusionSchema = z.object({
  ref: z.string(),
  name: z.string(),
  factId: z.uuid(),
  factValue: z.string(),
  factKind: z.enum(EPreferenceKind),
  factDomain: z.enum(EPreferenceDomain),
  // "Everyone" for a fact about the whole party
  subjectName: z.string(),
  reason: z.string()
})

export type TRunExclusion = z.infer<typeof RunExclusionSchema>

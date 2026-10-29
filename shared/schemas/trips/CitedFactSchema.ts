import { z } from 'zod'

import { EPreferenceDomain } from '~~/shared/schemas/knowledge-graph/PreferenceDomain'
import { EPreferenceKind } from '~~/shared/schemas/knowledge-graph/PreferenceKind'

// Kind, domain and subject are copied from the fact when the plan is made, so they outlive the fact
export const CitedFactSchema = z.object({
  id: z.uuid(),
  value: z.string(),
  kind: z.enum(EPreferenceKind),
  domain: z.enum(EPreferenceDomain),
  // "Everyone" for a fact about the whole party
  subjectName: z.string(),
  // false = code can't check the fact, so the match is the planner's own reading of the entry
  checkedByCode: z.boolean().default(true)
})

export type TCitedFact = z.infer<typeof CitedFactSchema>

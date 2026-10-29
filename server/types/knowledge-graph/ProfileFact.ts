import { z } from 'zod'

import { EPreferenceDomain } from '~~/shared/schemas/knowledge-graph/PreferenceDomain'
import { EPreferenceKind } from '~~/shared/schemas/knowledge-graph/PreferenceKind'
import { RuleSchema } from '~~/shared/schemas/knowledge-graph/RuleSchema'
import { ERuleStatus } from '~~/shared/schemas/knowledge-graph/RuleStatus'

export const ProfileFactSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  subjectPersonId: z.uuid().nullable(),
  kind: z.enum(EPreferenceKind),
  domain: z.enum(EPreferenceDomain),
  value: z.string(),
  ruleStatus: z.enum(ERuleStatus),
  rule: RuleSchema.nullable(),
  ruleSummary: z.string().nullable(),
  ruleNote: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type TProfileFact = z.infer<typeof ProfileFactSchema>

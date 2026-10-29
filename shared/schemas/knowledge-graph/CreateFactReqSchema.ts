import { z } from 'zod'

import { EPreferenceDomain } from '~~/shared/schemas/knowledge-graph/PreferenceDomain'
import { EPreferenceKind } from '~~/shared/schemas/knowledge-graph/PreferenceKind'

export const CreateFactReqSchema = z.object({
  // null = the party (everyone on the trip)
  subjectPersonId: z.uuid().nullable(),
  kind: z.enum(EPreferenceKind),
  domain: z.enum(EPreferenceDomain),
  value: z.string().trim().min(1, 'Describe the rule or preference').max(300, 'Keep it under 300 characters')
})

export type TCreateFactReq = z.infer<typeof CreateFactReqSchema>

import { z } from 'zod'

import { EPersonRole } from '~~/shared/schemas/knowledge-graph/PersonRole'
import { EPreferenceDomain } from '~~/shared/schemas/knowledge-graph/PreferenceDomain'
import { EPreferenceKind } from '~~/shared/schemas/knowledge-graph/PreferenceKind'
import { ERuleStatus } from '~~/shared/schemas/knowledge-graph/RuleStatus'

export const KnowledgeGraphResSchema = z.object({
  nodes: z.array(z.discriminatedUnion('type', [
    z.object({
      id: z.uuid(),
      type: z.literal('person'),
      name: z.string(),
      role: z.enum(EPersonRole)
    }),
    z.object({
      id: z.literal('party'),
      type: z.literal('party'),
      name: z.literal('Everyone')
    }),
    z.object({
      id: z.uuid(),
      type: z.literal('fact'),
      kind: z.enum(EPreferenceKind),
      domain: z.enum(EPreferenceDomain),
      value: z.string(),
      ruleStatus: z.enum(ERuleStatus),
      ruleSummary: z.string().nullable(),
      ruleNote: z.string().nullable()
    })
  ])),
  edges: z.array(z.object({
    from: z.string(),
    to: z.string(),
    type: z.enum(['member_of', 'applies_to'])
  }))
})

export type TKnowledgeGraphRes = z.infer<typeof KnowledgeGraphResSchema>

import { z } from 'zod'

import { RuleConditionSchema } from '~~/shared/schemas/knowledge-graph/RuleConditionSchema'
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'

// Hard constraint: an in-scope entry must pass `test`, else it is removed. Preference: an in-scope entry passing `test` matches
export const RuleSchema = z.object({
  scope: z.object({
    kind: z.enum(EItemKind),
    where: RuleConditionSchema.optional()
  }),
  test: RuleConditionSchema
})

export type TRule = z.infer<typeof RuleSchema>

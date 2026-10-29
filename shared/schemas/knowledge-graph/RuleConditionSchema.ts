import { z } from 'zod'

import { ERuleOperator } from '~~/shared/schemas/knowledge-graph/RuleOperator'

export type TRuleCondition =
  | { all: TRuleCondition[] } |
  { any: TRuleCondition[] } |
  { not: TRuleCondition } |
  { field: string; op: ERuleOperator; value: unknown }

export const RuleConditionSchema: z.ZodType<TRuleCondition> = z.lazy(() => z.union([
  z.strictObject({ all: z.array(RuleConditionSchema).min(1) }),
  z.strictObject({ any: z.array(RuleConditionSchema).min(1) }),
  z.strictObject({ not: RuleConditionSchema }),
  z.strictObject({ field: z.string(), op: z.enum(ERuleOperator), value: z.unknown() })
]))

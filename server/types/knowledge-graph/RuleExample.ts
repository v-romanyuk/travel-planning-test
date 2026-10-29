import { z } from 'zod'

// A catalogue-shaped entry the compiler wrote with the rule, and whether it passes the rule's test:
// for a hard constraint `passes` = kept, for a preference = preferred. Saved only when the real evaluator agrees
export const RuleExampleSchema = z.object({
  fields: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
  passes: z.boolean()
})

export type TRuleExample = z.infer<typeof RuleExampleSchema>

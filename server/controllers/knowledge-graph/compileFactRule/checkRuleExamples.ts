import { z } from 'zod'

import { evaluateRule, isRuleInScope } from '~~/server/utils/rules/evaluateRule'
import { validateExampleFields } from '~~/server/utils/rules/validateRule'
import { EPreferenceKind } from '~~/shared/schemas/knowledge-graph/PreferenceKind'
import { RuleExampleSchema } from '~~/server/types/knowledge-graph/RuleExample'
import type { TRuleExample } from '~~/server/types/knowledge-graph/RuleExample'
import type { TRule } from '~~/shared/schemas/knowledge-graph/RuleSchema'
import { formatRuleExample } from '~~/server/utils/rules/formatRuleExample'

const ExamplesSchema = z.array(RuleExampleSchema).min(2).max(6)

const describeOutcome = (kind: EPreferenceKind, passes: boolean) => kind === EPreferenceKind.HARD_CONSTRAINT
  ? passes ? 'kept' : 'removed'
  : passes ? 'preferred' : 'not preferred'

// The model's examples run through the planner's own evaluator: a test whose polarity is flipped against its
// meaning ("keeps red-eye flights") disagrees with them, which a summary sentence alone can never reveal
export const checkExamples = (
  rule: TRule,
  kind: EPreferenceKind,
  examplesJson: string | null
): { examples: TRuleExample[]; errors: string[] } => {
  if (!examplesJson) return { examples: [], errors: ['examplesJson is empty although enforceable is true'] }

  let raw: unknown
  try {
    raw = JSON.parse(examplesJson)
  } catch {
    return { examples: [], errors: ['examplesJson is not valid JSON'] }
  }

  const parsed = ExamplesSchema.safeParse(raw)
  if (!parsed.success) return { examples: [], errors: [`examplesJson doesn't follow the format: ${z.prettifyError(parsed.error)}`] }

  const examples = parsed.data
  const fieldErrors = examples.flatMap((example, i) => validateExampleFields(rule.scope.kind, example.fields, `examples[${i}]`))
  if (fieldErrors.length) return { examples, errors: fieldErrors }

  const errors = examples.some(e => e.passes) && examples.some(e => !e.passes)
    ? []
    : [`examples need at least one ${describeOutcome(kind, true)} and one ${describeOutcome(kind, false)} entry`]

  examples.forEach((example, i) => {
    const { fields } = example
    const entry = { kind: rule.scope.kind, priceAmount: typeof fields.priceAmount === 'number' ? fields.priceAmount : null, attributes: fields }
    const inScope = isRuleInScope(rule, entry)
    // Same outcome the planner gives: a hard rule never removes an entry outside its scope, a preference never ranks one
    const passes = inScope ? evaluateRule(rule, entry) : kind === EPreferenceKind.HARD_CONSTRAINT
    if (passes === example.passes) return

    errors.push(`examples[${i}] (${formatRuleExample(rule.scope.kind, fields)}): you expect it ${describeOutcome(kind, example.passes)}, ` +
      `but your test leaves it ${describeOutcome(kind, passes)}${inScope ? '' : ' because it is outside the rule\'s scope'}`)
  })

  return { examples, errors }
}

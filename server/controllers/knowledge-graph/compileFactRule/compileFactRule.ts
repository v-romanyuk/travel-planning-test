import { z } from 'zod'

import { checkExamples } from './checkRuleExamples'
import { buildCompileFactRuleMessage, buildCompileFactRuleSystemPrompt } from './compileFactRulePrompt'

import { useAgentService } from '~~/server/services/agent/agent.service'
import type { TCompiledFactRule } from '~~/server/types/knowledge-graph/CompiledFactRule'
import { createUserError } from '~~/server/utils/errorUtils'
import { collectLeaves, validateRule } from '~~/server/utils/rules/validateRule'
import { DOMAIN_SCOPE, RULE_FIELDS } from '~~/shared/constants/ruleFields'
import type { EPreferenceDomain } from '~~/shared/schemas/knowledge-graph/PreferenceDomain'
import type { EPreferenceKind } from '~~/shared/schemas/knowledge-graph/PreferenceKind'
import { RuleConditionSchema } from '~~/shared/schemas/knowledge-graph/RuleConditionSchema'
import type { TRule } from '~~/shared/schemas/knowledge-graph/RuleSchema'
import { ERuleStatus } from '~~/shared/schemas/knowledge-graph/RuleStatus'

interface ICompileFactRuleArgs {
  kind: EPreferenceKind
  domain: EPreferenceDomain
  value: string
}

// The condition travels as a JSON string: a recursive schema as tool input is brittle, and we validate it ourselves anyway
const CompileOutputSchema = z.object({
  enforceable: z.boolean().describe('true when the text can be checked with the listed fields only'),
  testJson: z.string().nullable().describe('when enforceable: the test condition as JSON'),
  summary: z.string().nullable().describe('when enforceable: one plain-language sentence for the traveller saying what the rule does'),
  examplesJson: z.string().nullable().describe('when enforceable: the worked examples as a JSON array'),
  note: z.string().nullable().describe('when not enforceable: which information the catalogue would need')
})

const testedFields = (rule: TRule) => new Set(collectLeaves(rule.test, 'test').map(({ leaf }) => (leaf as { field?: string }).field))

// `arrives` is a clock time, so "arrives < 22:00" alone keeps a flight landing at 00:23 the next day
const checkNextDayArrival = (rule: TRule) => {
  const fields = testedFields(rule)

  return fields.has('arrives') && !fields.has('arrivesNextDay')
    ? ['a test on arrives must also test arrivesNextDay, or an arrival after midnight passes as early']
    : []
}

// The summary is shown as is, so vocabulary leaking from the rule ("dietary tag vegan", "gluten_free") goes back for a retry
const checkSummaryWording = (summary: string, scope: TRule['scope']) => {
  const leaked = [
    // Only camelCase names: "stops" or "departs" are ordinary words in a good summary
    ...Object.keys(RULE_FIELDS[scope.kind]).filter(name => /[A-Z]/.test(name) && summary.includes(name)),
    ...(summary.match(/\b[a-z]+_[a-z_]+\b/g) ?? []),
    ...(summary.match(/\btags?\b/gi) ?? [])
  ]

  return leaked.length
    ? [`summary uses rule vocabulary (${[...new Set(leaked)].join(', ')}); say it in plain words for the traveller`]
    : []
}

const parseTest = (testJson: string | null, scope: TRule['scope']): { rule?: TRule; errors: string[] } => {
  if (!testJson) return { errors: ['testJson is empty although enforceable is true'] }

  let raw: unknown
  try {
    raw = JSON.parse(testJson)
  } catch {
    return { errors: ['testJson is not valid JSON'] }
  }

  const parsed = RuleConditionSchema.safeParse(raw)
  if (!parsed.success) return { errors: [`testJson doesn't follow the grammar: ${z.prettifyError(parsed.error)}`] }

  // The scope comes from the domain, never from the model
  const rule: TRule = { scope, test: parsed.data }

  return { rule, errors: [...validateRule(rule), ...checkNextDayArrival(rule)] }
}

/**
 * Turns a fact's free text into a checkable rule (or an unenforceable note) with one model call,
 * plus one retry carrying the validation errors. Throws a 502 user error when no valid rule comes back.
 */
export const compileFactRule = async ({ kind, domain, value }: ICompileFactRuleArgs): Promise<TCompiledFactRule> => {
  const { compileRule } = useAgentService()
  const systemPrompt = buildCompileFactRuleSystemPrompt(kind, domain)
  const scope = DOMAIN_SCOPE[domain]
  let message = buildCompileFactRuleMessage(value)

  for (let attempt = 0; attempt < 2; attempt++) {
    const output = await compileRule({ systemPrompt, message, schema: CompileOutputSchema, name: 'compile_rule' })
      .catch((error: unknown) => {
        console.error('[knowledge-graph] rule step failed', error instanceof Error ? error.name : 'unknown')
        throw createUserError({ statusCode: 502, message: 'We couldn\'t check this right now, so it wasn\'t saved. Try again in a moment.' })
      })

    if (!output.enforceable) {
      return {
        ruleStatus: ERuleStatus.UNENFORCEABLE,
        rule: null,
        ruleSummary: null,
        ruleNote: output.note?.trim() || 'The catalogue has no information to check this.'
      }
    }

    const { rule, errors } = parseTest(output.testJson, scope)
    // Examples are only meaningful against a valid test
    const checked = rule && errors.length === 0 ? checkExamples(rule, kind, output.examplesJson) : { examples: [], errors: [] }
    const summary = output.summary?.trim()
    const allErrors = [...errors, ...checked.errors, ...(summary ? checkSummaryWording(summary, scope) : ['summary is empty'])]
    if (rule && allErrors.length === 0 && summary) {
      return { ruleStatus: ERuleStatus.COMPILED, rule, ruleSummary: summary, ruleNote: null }
    }

    message = buildCompileFactRuleMessage(value, allErrors)
  }

  throw createUserError({ statusCode: 502, message: 'We couldn\'t turn this into a rule, so it wasn\'t saved. Try rephrasing it.' })
}

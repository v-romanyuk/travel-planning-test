import type { TCatalogueEntry } from '~~/server/types/catalogue/CatalogueEntry'
import { RULE_FIELDS } from '~~/shared/constants/ruleFields'
import { ERuleOperator } from '~~/shared/schemas/knowledge-graph/RuleOperator'
import type { TRuleCondition } from '~~/shared/schemas/knowledge-graph/RuleConditionSchema'
import type { TRule } from '~~/shared/schemas/knowledge-graph/RuleSchema'

// Three-valued: `null` = a tested field is missing on the entry. It stays unknown through `not`, so negating
// a check can never turn missing data into a pass — the final answer treats unknown as a fail (fail closed)
type TTruth = boolean | null

// Only what a rule can read: a catalogue entry, or a compiler example checked at save time
export type TRuleSubjectEntry = Pick<TCatalogueEntry, 'kind' | 'priceAmount'> & { attributes: Record<string, unknown> }

const ruleSubject = (entry: TRuleSubjectEntry): Record<string, unknown> => {
  const fields = RULE_FIELDS[entry.kind]
  const source: Record<string, unknown> = { ...entry.attributes, priceAmount: entry.priceAmount }

  return Object.fromEntries(Object.keys(fields).map(name => [name, source[name]]))
}

const compare = (actual: unknown, op: ERuleOperator, expected: unknown): boolean => {
  switch (op) {
    case ERuleOperator.EQ: return actual === expected
    case ERuleOperator.NEQ: return actual !== expected
    case ERuleOperator.IN: return Array.isArray(expected) && expected.includes(actual)
    case ERuleOperator.NIN: return Array.isArray(expected) && !expected.includes(actual)
    case ERuleOperator.CONTAINS: return Array.isArray(actual) && actual.includes(expected)
    case ERuleOperator.BETWEEN: {
      if (!Array.isArray(expected) || expected.length !== 2) return false
      const [from, to] = expected as [number | string, number | string]
      const value = actual as number | string

      // Time windows like 22:00–05:59 wrap past midnight
      return from <= to ? value >= from && value <= to : value >= from || value <= to
    }
  }

  const value = actual as number | string
  const bound = expected as number | string
  switch (op) {
    case ERuleOperator.LT: return value < bound
    case ERuleOperator.LTE: return value <= bound
    case ERuleOperator.GT: return value > bound
    case ERuleOperator.GTE: return value >= bound
  }
}

const evaluateCondition = (condition: TRuleCondition, subject: Record<string, unknown>): TTruth => {
  if ('all' in condition) {
    const results = condition.all.map(c => evaluateCondition(c, subject))
    if (results.includes(false)) return false

    return results.includes(null) ? null : true
  }
  if ('any' in condition) {
    const results = condition.any.map(c => evaluateCondition(c, subject))
    if (results.includes(true)) return true

    return results.includes(null) ? null : false
  }
  if ('not' in condition) {
    const result = evaluateCondition(condition.not, subject)

    return result === null ? null : !result
  }

  const actual = subject[condition.field]
  if (actual === undefined || actual === null) return null

  return compare(actual, condition.op, condition.value)
}

export const isRuleInScope = (rule: TRule, entry: TRuleSubjectEntry) => rule.scope.kind === entry.kind &&
  (!rule.scope.where || evaluateCondition(rule.scope.where, ruleSubject(entry)) === true)

/**
 * The only rule evaluator. `true` when the entry passes the rule's test; an entry out of the rule's scope is never
 * passed here — check `isRuleInScope` first. A missing tested field fails.
 */
export const evaluateRule = (rule: TRule, entry: TRuleSubjectEntry) => evaluateCondition(rule.test, ruleSubject(entry)) === true

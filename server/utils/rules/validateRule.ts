import { z } from 'zod'

import { RULE_FIELDS, RULE_OPERATORS_BY_TYPE } from '~~/shared/constants/ruleFields'
import type { IRuleField } from '~~/shared/constants/ruleFields'
import { ClockTimeSchema } from '~~/shared/schemas/catalogue/ClockTimeSchema'
import { ERuleOperator } from '~~/shared/schemas/knowledge-graph/RuleOperator'
import type { TRuleCondition } from '~~/shared/schemas/knowledge-graph/RuleConditionSchema'
import type { TRule } from '~~/shared/schemas/knowledge-graph/RuleSchema'
import type { EItemKind } from '~~/shared/schemas/trips/ItemKind'

const LIST_OPERATORS = [ERuleOperator.IN, ERuleOperator.NIN]

const scalarSchema = (field: IRuleField) => {
  switch (field.type) {
    case 'enum': return z.enum(field.values as [string, ...string[]])
    case 'time': return ClockTimeSchema
    case 'boolean': return z.boolean()
    case 'int': return z.int()
    case 'number': return z.number()
    case 'string':
    case 'string[]': return z.string().trim().min(1)
  }
}

// One object per operator group, so the value's shape follows the operator: a list for in/nin, a pair for between
const fieldConditionSchema = (name: string, field: IRuleField) => {
  const operators = RULE_OPERATORS_BY_TYPE[field.type]
  const scalar = scalarSchema(field)
  const groups = [
    { ops: operators.filter(op => LIST_OPERATORS.includes(op)), value: z.array(scalar).min(1) },
    { ops: operators.filter(op => op === ERuleOperator.BETWEEN), value: z.tuple([scalar, scalar]) },
    { ops: operators.filter(op => op !== ERuleOperator.BETWEEN && !LIST_OPERATORS.includes(op)), value: scalar }
  ].filter(group => group.ops.length > 0)

  const [first, ...rest] = groups.map(group => z.object({
    field: z.literal(name),
    op: z.enum(group.ops as [ERuleOperator, ...ERuleOperator[]]),
    value: group.value
  }))

  return z.discriminatedUnion('op', [first!, ...rest])
}

const buildLeafSchema = (kind: EItemKind) => {
  const [first, ...rest] = Object.entries(RULE_FIELDS[kind]).map(([name, field]) => fieldConditionSchema(name, field))

  return z.discriminatedUnion('field', [first!, ...rest])
}

// RULE_FIELDS is static, so each kind's schema is built once
const leafSchemas = new Map<EItemKind, ReturnType<typeof buildLeafSchema>>()
const leafSchemaFor = (kind: EItemKind) => {
  if (!leafSchemas.has(kind)) leafSchemas.set(kind, buildLeafSchema(kind))

  return leafSchemas.get(kind)!
}

// The and/or/not structure is already checked by RuleConditionSchema; this walks it to validate each field test
export const collectLeaves = (condition: TRuleCondition, path: string): { path: string; leaf: unknown }[] => {
  if ('all' in condition) return condition.all.flatMap((c, i) => collectLeaves(c, `${path}.all[${i}]`))
  if ('any' in condition) return condition.any.flatMap((c, i) => collectLeaves(c, `${path}.any[${i}]`))
  if ('not' in condition) return collectLeaves(condition.not, `${path}.not`)

  return [{ path, leaf: condition }]
}

/** Checks an example entry's fields against the RULE_FIELDS registry; returns readable errors, empty when valid. */
export const validateExampleFields = (kind: EItemKind, fields: Record<string, unknown>, path: string): string[] => {
  const registry = RULE_FIELDS[kind]

  return Object.entries(fields).flatMap(([name, value]) => {
    const field = registry[name]
    if (!field) return [`${path}.${name}: no such field`]

    const schema = field.type === 'string[]' ? z.array(z.string().trim().min(1)) : scalarSchema(field)
    const result = schema.safeParse(value)

    return result.success ? [] : [`${path}.${name}: ${z.prettifyError(result.error).replaceAll('\n', ' ')}`]
  })
}

/** Checks a rule against the RULE_FIELDS registry; returns readable errors, empty when valid. */
export const validateRule = (rule: TRule): string[] => {
  const schema = leafSchemaFor(rule.scope.kind)

  return collectLeaves(rule.test, 'test').flatMap(({ path, leaf }) => {
    const result = schema.safeParse(leaf)

    return result.success ? [] : [`${path}: ${z.prettifyError(result.error).replaceAll('\n', ' ')}`]
  })
}

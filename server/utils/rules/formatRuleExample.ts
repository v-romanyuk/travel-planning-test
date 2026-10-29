import { RULE_FIELDS } from '~~/shared/constants/ruleFields'
import type { TRuleExample } from '~~/server/types/knowledge-graph/RuleExample'
import type { EItemKind } from '~~/shared/schemas/trips/ItemKind'

/** One example in readable words for the compiler's retry message, fields in RULE_FIELDS order: "flight, departs 14:35". */
export const formatRuleExample = (kind: EItemKind, fields: TRuleExample['fields']) => Object.entries(RULE_FIELDS[kind])
  .flatMap(([name, field]) => {
    const value = fields[name]
    if (value === undefined) return []

    switch (field.type) {
      case 'enum':
      case 'string': return [String(value)]
      case 'boolean': return [value ? field.label : `not ${field.label}`]
      case 'int': return [`${String(value)} ${field.label}`]
      case 'number': return [`${field.label} €${String(value)}`]
      case 'string[]': return [`${field.label}: ${Array.isArray(value) && value.length ? value.join(', ') : 'none'}`]
      case 'time': return [`${field.label} ${String(value)}`]
    }
  })
  .join(', ')

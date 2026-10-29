import { DOMAIN_SCOPE, RULE_FIELDS, RULE_OPERATORS_BY_TYPE } from '~~/shared/constants/ruleFields'
import type { EPreferenceDomain } from '~~/shared/schemas/knowledge-graph/PreferenceDomain'
import { EPreferenceKind } from '~~/shared/schemas/knowledge-graph/PreferenceKind'
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'

// Field list is generated from RULE_FIELDS, so the model's vocabulary and the validator can't drift apart
const describeFields = (domain: EPreferenceDomain) => Object.entries(RULE_FIELDS[DOMAIN_SCOPE[domain].kind])
  .map(([name, field]) => {
    const values = field.values ? `: ${field.values.join(' | ')}` : ''
    const operators = RULE_OPERATORS_BY_TYPE[field.type].join(', ')

    return `- ${name} (${field.type}${values}; operators: ${operators}) — ${field.description}`
  })
  .join('\n')

export const buildCompileFactRuleSystemPrompt = (kind: EPreferenceKind, domain: EPreferenceDomain) => {
  const scope = DOMAIN_SCOPE[domain]
  const isHard = kind === EPreferenceKind.HARD_CONSTRAINT

  return `You turn a traveller's ${isHard ? 'hard constraint' : 'preference'} about ${domain} into a rule over catalogue fields.
The rule applies to catalogue entries of kind "${scope.kind}"${scope.where ? ` matching ${JSON.stringify(scope.where)}` : ''}.

Fields you may test (nothing else exists):
${describeFields(domain)}

Condition JSON grammar:
- {"all": [cond, ...]} | {"any": [cond, ...]} | {"not": cond}
- {"field": "<name>", "op": "<operator>", "value": <value>}
- "in"/"nin" take an array; "between" takes [from, to] inclusive, and a time window may wrap past midnight (["22:00","05:59"]); "contains" tests one tag on a list field.
- Times are "HH:mm", local to the entry's city. Prices are EUR.
${scope.kind === EItemKind.TRANSPORT
  ? `- "arrives" is the clock time on the arrival day. An overnight arrival (arrivesNextDay true) at 00:30 is later than 23:00 the same day, so every test on "arrives" must also test "arrivesNextDay". "Arrive before 22:00" → {"all": [{"field": "arrivesNextDay", "op": "eq", "value": false}, {"field": "arrives", "op": "lt", "value": "22:00"}]}.
- A region (Europe, the Schengen area, the Balkans) is the list of its country codes, tested with "in"/"nin" on fromCountry and toCountry. "No flights within Europe" → {"any": [{"field": "mode", "op": "neq", "value": "flight"}, {"field": "fromCountry", "op": "nin", "value": ["PL", "DE", ...every European code]}, {"field": "toCountry", "op": "nin", "value": [...the same codes]}]}.
`
  : ''}
${isHard
  ? `The test describes an ACCEPTABLE entry, one that is KEPT: entries that fail it are removed. Summary starts with "Removes".
Worked example, "No red-eye flights" (transport):
- testJson: {"any": [{"field": "mode", "op": "neq", "value": "flight"}, {"not": {"field": "departs", "op": "between", "value": ["22:00", "05:59"]}}]}
- summary: "Removes flights departing 22:00–05:59; trains and buses are kept."
- examplesJson: [{"fields": {"mode": "flight", "departs": "14:35"}, "passes": true}, {"fields": {"mode": "flight", "departs": "22:45"}, "passes": false}, {"fields": {"mode": "train", "departs": "23:10"}, "passes": true}]
Note the "not": the test says what a kept flight looks like, never what a removed one looks like.`
  : `The test describes a MATCHING entry: entries passing it are preferred. Summary starts with "Prefers".
Worked example, "Direct flights" (transport):
- testJson: {"field": "stops", "op": "eq", "value": 0}
- summary: "Prefers direct connections (0 stops)."
- examplesJson: [{"fields": {"mode": "flight", "stops": 0}, "passes": true}, {"fields": {"mode": "flight", "stops": 1}, "passes": false}]`}

The summary is shown to the traveller: plain everyday words, as a person would say it. Never use field names, tag values, codes or operators: "Removes food places that aren't vegan", not "Removes places without dietary tag vegan"; "Keeps trains and buses; removes flights between European countries", not "Removes flights where fromCountry in [PL, DE, …]". Name countries and regions, never their codes.

examplesJson is 2–6 entries of kind "${scope.kind}"${scope.where ? ` matching ${JSON.stringify(scope.where)}` : ''}, written with the fields above, each with "passes": ${isHard ? 'true when the traveller would keep it, false when the rule must remove it' : 'true when it is what the traveller prefers, false otherwise'}. Decide "passes" from the traveller's text, not from your test: the examples are run through your test and any disagreement rejects the rule. Give at least one passing and one failing entry, and give every example a value for each field your test reads${scope.where ? ' and for the scope fields' : ''}.

If the meaning needs information these fields don't hold (e.g. distance to the airport, star ratings, noise levels), set enforceable=false and say in the note which information is missing, e.g. "The catalogue has no distance to the airport for stays." Never approximate a meaning with an unrelated field.`
}

export const buildCompileFactRuleMessage = (value: string, previousErrors: string[] = []) => {
  const text = `Text: ${JSON.stringify(value)}`
  if (previousErrors.length === 0) return text

  return `${text}\n\nYour previous answer was invalid:\n${previousErrors.map(e => `- ${e}`).join('\n')}\nFix it.`
}

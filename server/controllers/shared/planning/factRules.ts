import type { TCatalogueEntry } from '~~/server/types/catalogue/CatalogueEntry'
import type { TProfileFact } from '~~/server/types/knowledge-graph/ProfileFact'
import type { TCitedFact } from '~~/shared/schemas/trips/CitedFactSchema'
import type { TRunExclusion } from '~~/shared/schemas/trips/RunExclusionSchema'
import { evaluateRule, isRuleInScope } from '~~/server/utils/rules/evaluateRule'
import { EPreferenceKind } from '~~/shared/schemas/knowledge-graph/PreferenceKind'
import type { TRule } from '~~/shared/schemas/knowledge-graph/RuleSchema'
import { ERuleStatus } from '~~/shared/schemas/knowledge-graph/RuleStatus'

export type TCompiledFact = TProfileFact & { rule: TRule }

export interface IRunFacts {
  hard: TCompiledFact[]
  preferences: TCompiledFact[]
  unenforceable: TProfileFact[]
  // "Everyone" for a party fact
  subjectName: (fact: TProfileFact) => string
}

const isCompiled = (fact: TProfileFact): fact is TCompiledFact => fact.ruleStatus === ERuleStatus.COMPILED && fact.rule !== null

export const splitRunFacts = (facts: TProfileFact[], nameByPersonId: Map<string, string>): IRunFacts => ({
  hard: facts.filter(isCompiled).filter(fact => fact.kind === EPreferenceKind.HARD_CONSTRAINT),
  preferences: facts.filter(isCompiled).filter(fact => fact.kind === EPreferenceKind.PREFERENCE),
  unenforceable: facts.filter(fact => !isCompiled(fact)),
  subjectName: fact => fact.subjectPersonId ? nameByPersonId.get(fact.subjectPersonId) ?? 'Traveller' : 'Everyone'
})

/** Hard constraints in scope for the entry that it fails — non-empty means the entry is removed. */
export const findViolatedFacts = (entry: TCatalogueEntry, hard: TCompiledFact[]) => {
  return hard.filter(fact => isRuleInScope(fact.rule, entry) && !evaluateRule(fact.rule, entry))
}

export const findMatchedPreferences = (entry: TCatalogueEntry, preferences: TCompiledFact[]) => {
  return preferences.filter(fact => isRuleInScope(fact.rule, entry) && evaluateRule(fact.rule, entry))
}

export const toExclusions = (
  entry: TCatalogueEntry,
  violated: TCompiledFact[],
  facts: IRunFacts
): TRunExclusion[] => violated.map(fact => ({
  ref: entry.ref,
  name: entry.name,
  factId: fact.id,
  factValue: fact.value,
  factKind: fact.kind,
  factDomain: fact.domain,
  subjectName: facts.subjectName(fact),
  reason: fact.ruleSummary ?? fact.value
}))

export const toCitedFact = (fact: TProfileFact, facts: IRunFacts): TCitedFact => ({
  id: fact.id,
  value: fact.value,
  kind: fact.kind,
  domain: fact.domain,
  subjectName: facts.subjectName(fact),
  checkedByCode: isCompiled(fact)
})

export const exclusionKey = (exclusion: Pick<TRunExclusion, 'ref' | 'factId'>) => `${exclusion.ref}:${exclusion.factId}`

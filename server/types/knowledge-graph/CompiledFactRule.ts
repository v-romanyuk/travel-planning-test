import type { TProfileFact } from '~~/server/types/knowledge-graph/ProfileFact'

export type TCompiledFactRule = Pick<TProfileFact, 'ruleStatus' | 'rule' | 'ruleSummary' | 'ruleNote'>

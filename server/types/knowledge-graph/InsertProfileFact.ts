import type { TProfileFact } from '~~/server/types/knowledge-graph/ProfileFact'

export type TInsertProfileFact = Pick<TProfileFact, 'userId' | 'subjectPersonId' | 'kind' | 'domain' | 'value' | 'ruleStatus' | 'rule' | 'ruleSummary' | 'ruleNote'>

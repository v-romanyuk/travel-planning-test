import { repos } from '~~/server/repos'
import type { TUser } from '~~/server/types/user/User'
import type { TKnowledgeGraphRes } from '~~/shared/schemas/knowledge-graph/KnowledgeGraphResSchema'

const PARTY_ID = 'party'

export const getKnowledgeGraph = async (user: TUser): Promise<TKnowledgeGraphRes> => {
  const [people, facts] = await Promise.all([
    repos.peopleRepo.findPeopleByUserId(user.id),
    repos.profileFactsRepo.findProfileFactsByUserId(user.id)
  ])

  const nodes: TKnowledgeGraphRes['nodes'] = [
    ...people.map(person => ({ id: person.id, type: 'person' as const, name: person.name ?? user.fullName, role: person.role })),
    { id: PARTY_ID, type: 'party' as const, name: 'Everyone' as const },
    ...facts.map(fact => ({
      id: fact.id,
      type: 'fact' as const,
      kind: fact.kind,
      domain: fact.domain,
      value: fact.value,
      ruleStatus: fact.ruleStatus,
      ruleSummary: fact.ruleSummary,
      ruleNote: fact.ruleNote
    }))
  ]

  const edges: TKnowledgeGraphRes['edges'] = [
    ...people.map(person => ({ from: person.id, to: PARTY_ID, type: 'member_of' as const })),
    ...facts.map(fact => ({ from: fact.id, to: fact.subjectPersonId ?? PARTY_ID, type: 'applies_to' as const }))
  ]

  return { nodes, edges }
}

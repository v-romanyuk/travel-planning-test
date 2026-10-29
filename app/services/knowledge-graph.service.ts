import type { TCreateFactReq } from '~~/shared/schemas/knowledge-graph/CreateFactReqSchema'
import type { TCreatePersonReq } from '~~/shared/schemas/knowledge-graph/CreatePersonReqSchema'

class KnowledgeGraphService {
  getKnowledgeGraph () {
    return $fetch('/api/knowledge-graph')
  }

  createPerson (body: TCreatePersonReq) {
    return $fetch('/api/knowledge-graph/people', { method: 'POST', body })
  }

  deletePerson (personId: string) {
    return $fetch(`/api/knowledge-graph/people/${personId}`, { method: 'DELETE' })
  }

  // No client timeout: the rule step can take ~40 s
  createFact (body: TCreateFactReq) {
    return $fetch('/api/knowledge-graph/facts', { method: 'POST', body })
  }

  deleteFact (factId: string) {
    return $fetch(`/api/knowledge-graph/facts/${factId}`, { method: 'DELETE' })
  }
}

export const knowledgeGraphService = new KnowledgeGraphService()

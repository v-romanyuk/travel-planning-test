type TKnowledgeGraphNode = import('~~/shared/schemas/knowledge-graph/KnowledgeGraphResSchema').TKnowledgeGraphRes['nodes'][number]

// A fact node with its subject read from the `applies_to` edge; null = everyone on the trip
type TProfileFact = Extract<TKnowledgeGraphNode, { type: 'fact' }> & { subjectPersonId: string | null }

type TPersonTone = 'party' | 'traveller' | 'companion'

interface IProfileRow {
  id: string
  tone: TPersonTone
  name: string
  role: string
  initials: string
  facts: TProfileFact[]
}

// "Add to your profile" form, shaped like `CreateFactReqSchema`
type TFactDraft = import('~~/shared/schemas/knowledge-graph/CreateFactReqSchema').TCreateFactReq

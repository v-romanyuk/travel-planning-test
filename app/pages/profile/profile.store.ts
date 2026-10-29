import type { TKnowledgeGraphRes } from '~~/shared/schemas/knowledge-graph/KnowledgeGraphResSchema'
import { EPersonRole } from '~~/shared/schemas/knowledge-graph/PersonRole'
import { EPreferenceDomain } from '~~/shared/schemas/knowledge-graph/PreferenceDomain'
import { EPreferenceKind } from '~~/shared/schemas/knowledge-graph/PreferenceKind'

type TPersonNode = Extract<TKnowledgeGraphNode, { type: 'person' }>

const PARTY_ID = 'party'

const words = (name: string) => name.trim().split(/\s+/).filter(Boolean)

const firstName = (name: string) => words(name)[0] ?? name

const initialsOf = (name: string) => {
  const parts = words(name)
  const letters = parts.length > 1 ? `${parts[0]![0]}${parts.at(-1)![0]}` : (parts[0]?.[0] ?? '?')

  return letters.toUpperCase()
}

// Three letters overflow the avatar, so a bigger party shows the traveller's initial and the companion count
const partyInitials = (firstNames: string[]) => {
  const [first = '?', ...others] = firstNames.map(name => name[0]!.toUpperCase())

  return others.length > 1 ? `${first}+${others.length}` : [first, ...others].join('+')
}

const listNames = (names: string[]) => names.length < 2
  ? names.join('')
  : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`

const emptyDraft = (): TFactDraft => ({
  subjectPersonId: null,
  kind: EPreferenceKind.PREFERENCE,
  domain: EPreferenceDomain.STAY,
  value: ''
})

const buildRows = (graph: TKnowledgeGraphRes): IProfileRow[] => {
  const subjectOf = new Map(graph.edges.filter(edge => edge.type === 'applies_to').map(edge => [edge.from, edge.to]))
  const facts: TProfileFact[] = graph.nodes.flatMap((node) => {
    if (node.type !== 'fact') return []
    const subject = subjectOf.get(node.id) ?? PARTY_ID

    return [{ ...node, subjectPersonId: subject === PARTY_ID ? null : subject }]
  })
  const factsOf = (subjectPersonId: string | null) => facts.filter(fact => fact.subjectPersonId === subjectPersonId)

  const people = graph.nodes.filter((node): node is TPersonNode => node.type === 'person')
  const traveller = people.find(person => person.role === EPersonRole.TRAVELLER)
  const companions = people.filter(person => person.role === EPersonRole.COMPANION)
  const party = [...(traveller ? [traveller] : []), ...companions]
  const firstNames = party.map(person => firstName(person.name))

  return [
    {
      id: PARTY_ID,
      tone: 'party',
      name: 'Everyone',
      role: companions.length ? listNames(firstNames) : 'Just you',
      initials: partyInitials(firstNames),
      facts: factsOf(null)
    },
    ...(traveller
      ? [{
        id: traveller.id,
        tone: 'traveller' as const,
        name: traveller.name,
        role: 'You, the traveller',
        initials: initialsOf(traveller.name),
        facts: factsOf(traveller.id)
      }]
      : []),
    ...companions.map(companion => ({
      id: companion.id,
      tone: 'companion' as const,
      name: companion.name,
      role: `Travels with ${traveller ? firstName(traveller.name) : 'you'}`,
      initials: initialsOf(companion.name),
      facts: factsOf(companion.id)
    }))
  ]
}

export const useProfileStore = defineStore('profile', () => {
  const graph = ref<TKnowledgeGraphRes>()
  const draft = ref<TFactDraft>(emptyDraft())
  const factSaving = ref(false)

  const rows = computed(() => graph.value ? buildRows(graph.value) : [])

  async function fetchGraph () {
    graph.value = await knowledgeGraphService.getKnowledgeGraph()
  }

  // A removed person can't stay selected in the form
  function forgetPerson (personId: string) {
    if (draft.value.subjectPersonId === personId) draft.value.subjectPersonId = null
  }

  function reset () {
    graph.value = undefined
    draft.value = emptyDraft()
    factSaving.value = false
  }

  return {
    graph,
    draft,
    factSaving,
    rows,
    fetchGraph,
    forgetPerson,
    reset
  }
})

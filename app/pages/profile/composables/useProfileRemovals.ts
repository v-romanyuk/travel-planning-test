import { EPreferenceKind } from '~~/shared/schemas/knowledge-graph/PreferenceKind'

const countFacts = (facts: TProfileFact[]) => {
  const rules = facts.filter(fact => fact.kind === EPreferenceKind.HARD_CONSTRAINT).length
  const preferences = facts.length - rules
  const parts = [
    ...(rules ? [`${rules} hard ${rules === 1 ? 'rule' : 'rules'}`] : []),
    ...(preferences ? [`${preferences} ${preferences === 1 ? 'preference' : 'preferences'}`] : [])
  ]

  return parts.join(' and ')
}

/** Removing a fact or a companion, each behind a confirmation. Every removal re-reads the graph. */
export function useProfileRemovals () {
  const profileStore = useProfileStore()
  const refresh = useProfileRefresh()
  const { openModal } = useModals()
  const toast = useToast()

  // A refused removal closes the confirmation and shows why; nothing on the page changes
  async function removeFact (fact: TProfileFact) {
    try {
      await knowledgeGraphService.deleteFact(fact.id)
    } catch (error) {
      toast.add({ title: 'Couldn\'t remove it', description: getErrorMessage(error), color: 'error' })

      return
    }

    await refresh()
  }

  async function removeCompanion (row: IProfileRow) {
    try {
      await knowledgeGraphService.deletePerson(row.id)
    } catch (error) {
      toast.add({ title: `Couldn't remove ${row.name}`, description: getErrorMessage(error), color: 'error' })

      return
    }

    profileStore.forgetPerson(row.id)
    await refresh()
  }

  function confirmRemoveFact (fact: TProfileFact) {
    openModal('AppConfirmModal', {
      title: `Remove '${fact.value}'?`,
      description: 'The planner stops using it the next time it plans. This can\'t be undone.',
      confirmLabel: 'Remove',
      onConfirm: () => removeFact(fact)
    })
  }

  function confirmRemoveCompanion (row: IProfileRow) {
    const facts = countFacts(row.facts)
    openModal('AppConfirmModal', {
      title: `Remove ${row.name}?`,
      description: facts
        ? `Their ${facts} will be removed with them. This can't be undone.`
        : 'They have no rules or preferences stored. This can\'t be undone.',
      confirmLabel: 'Remove',
      onConfirm: () => removeCompanion(row)
    })
  }

  return { confirmRemoveFact, confirmRemoveCompanion }
}

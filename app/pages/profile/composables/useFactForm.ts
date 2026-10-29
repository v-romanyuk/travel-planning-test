import type { FormError } from '@nuxt/ui'

/** "Add to your profile": a save waits for the server's rule check (up to ~40 s). */
export function useFactForm () {
  const { draft, factSaving } = storeToRefs(useProfileStore())
  const refresh = useProfileRefresh()

  // Resolves to errors for the form fields; a failed check lands on "What is it?" with everything typed kept
  async function submit (): Promise<FormError[]> {
    if (factSaving.value) return []

    factSaving.value = true
    try {
      await knowledgeGraphService.createFact(draft.value)
      draft.value.value = ''
      await refresh()

      return []
    } catch (error) {
      const fieldErrors = getFormErrors(error)

      return fieldErrors.length
        ? fieldErrors
        : [{ name: 'value', message: getErrorMessage(error, 'This wasn\'t saved. Try again.') }]
    } finally {
      factSaving.value = false
    }
  }

  return { submit }
}

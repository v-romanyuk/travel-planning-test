/** "Add a companion": a new person with no facts; the trip request form lists them the next time it opens. */
export function useAddCompanion () {
  const refresh = useProfileRefresh()
  const toast = useToast()

  const adding = ref(false)

  // Resolves to whether the companion was added, so the form knows to clear
  async function add (name: string) {
    if (adding.value) return false

    adding.value = true
    try {
      await knowledgeGraphService.createPerson({ name })
    } catch (error) {
      toast.add({ title: 'Couldn\'t add the companion', description: getErrorMessage(error), color: 'error' })

      return false
    } finally {
      adding.value = false
    }

    await refresh()

    return true
  }

  return { adding, add }
}

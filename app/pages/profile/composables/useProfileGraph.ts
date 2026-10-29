/** The profile page's first load of the knowledge graph. */
export function useProfileGraph () {
  const profileStore = useProfileStore()

  const loading = ref(true)
  const loadError = ref<string | null>(null)

  async function load () {
    loading.value = true
    loadError.value = null
    try {
      await profileStore.fetchGraph()
    } catch (error) {
      loadError.value = getErrorMessage(error, 'Your profile couldn\'t be loaded. Try again.')
    } finally {
      loading.value = false
    }
  }

  return { loading, loadError, load }
}

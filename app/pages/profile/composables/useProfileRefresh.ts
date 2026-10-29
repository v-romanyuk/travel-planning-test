/** Re-reads the graph after a change; a failed re-read keeps what's shown and says so. */
export function useProfileRefresh () {
  const profileStore = useProfileStore()
  const toast = useToast()

  return async () => {
    try {
      await profileStore.fetchGraph()
    } catch (error) {
      toast.add({
        title: 'Saved, but the page couldn\'t refresh',
        description: getErrorMessage(error, 'Reload the page to see the latest version.'),
        color: 'warning'
      })
    }
  }
}

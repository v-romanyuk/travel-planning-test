import type { MaybeRefOrGetter } from 'vue'

const POLL_MS = 3000

/** Loads the trip into the store and, while it's planning, refetches every 3 s until it's ready or failed. */
export function useTripLoader (tripId: MaybeRefOrGetter<string>) {
  const tripStore = useTripStore()
  const { trip, isPlanning } = storeToRefs(tripStore)
  const toast = useToast()

  const loading = ref(false)
  const loadError = ref<string | null>(null)
  // One toast per run of failed polls, not one every 3 seconds
  let pollFailing = false

  async function load () {
    const id = toValue(tripId)
    if (trip.value?.id !== id) tripStore.reset()

    loading.value = !trip.value
    loadError.value = null
    try {
      await tripStore.fetchTrip(id)
    } catch (error) {
      loadError.value = getErrorMessage(error, 'This trip couldn\'t be loaded. Try again.')
    } finally {
      loading.value = false
    }
  }

  async function poll () {
    try {
      await tripStore.fetchTrip(toValue(tripId))
      pollFailing = false
    } catch (error) {
      if (!pollFailing) {
        toast.add({ title: 'Couldn\'t refresh the trip', description: getErrorMessage(error), color: 'error' })
      }
      pollFailing = true
    }
  }

  const { pause, resume } = useIntervalFn(() => {
    poll()
  }, POLL_MS, { immediate: false })

  watch(isPlanning, (planning) => {
    if (planning) resume()
    else pause()
  }, { immediate: true })
  watch(() => toValue(tripId), () => {
    load()
  }, { immediate: true })

  return { loading, loadError, load }
}

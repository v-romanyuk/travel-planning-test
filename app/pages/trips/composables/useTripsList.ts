import type { TTripsListRes } from '~~/shared/schemas/trips/TripsListResSchema'
import { ETripStatus } from '~~/shared/schemas/trips/TripStatus'

const POLL_MS = 5000

/** The user's trips, newest first; refreshed every 5 s while any of them is planning. */
export function useTripsList () {
  const toast = useToast()

  const trips = ref<TTripsListRes>([])
  const loading = ref(true)
  const loadError = ref<string | null>(null)
  let pollFailing = false

  async function load () {
    loading.value = true
    loadError.value = null
    try {
      trips.value = await tripsService.getAll()
    } catch (error) {
      loadError.value = getErrorMessage(error, 'Try again in a moment.')
    } finally {
      loading.value = false
    }
  }

  async function poll () {
    try {
      trips.value = await tripsService.getAll()
      pollFailing = false
    } catch (error) {
      if (!pollFailing) toast.add({ title: 'Couldn\'t refresh your trips', description: getErrorMessage(error), color: 'error' })
      pollFailing = true
    }
  }

  const anyPlanning = computed(() => trips.value.some(trip => trip.status === ETripStatus.PLANNING))
  const { pause, resume } = useIntervalFn(() => {
    poll()
  }, POLL_MS, { immediate: false })

  watch(anyPlanning, (planning) => {
    if (planning) resume()
    else pause()
  }, { immediate: true })
  onMounted(() => {
    load()
  })

  return { trips, loading, loadError, load }
}

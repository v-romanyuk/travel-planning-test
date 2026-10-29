import type { FormError } from '@nuxt/ui'

import type { TCity } from '~~/shared/schemas/cities/CitySchema'
import { EPersonRole } from '~~/shared/schemas/knowledge-graph/PersonRole'
import type { TCreateTripReq } from '~~/shared/schemas/trips/CreateTripReqSchema'

interface ITripRequestState {
  origin: TCity | undefined
  destination: TCity | undefined
  startDate: string
  endDate: string
  companionIds: string[]
  notes: string | null
  timeZone: string
  whatsappOptIn: boolean
  whatsappNumber: string | null
}

/** The request form's data: companions from the profile, the home city as origin, and a failed trip's pre-fill. */
export function useTripRequestForm (fromTripId: MaybeRefOrGetter<string | undefined>) {
  const authStore = useAuthStore()
  const tripStore = useTripStore()
  const toast = useToast()

  const state = reactive<ITripRequestState>({
    origin: authStore.user?.homeCity,
    destination: undefined,
    startDate: '',
    endDate: '',
    companionIds: [],
    notes: null,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    whatsappOptIn: false,
    whatsappNumber: null
  })
  const companions = ref<{ id: string; name: string }[]>([])
  const loading = ref(true)
  const loadError = ref<string | null>(null)
  const submitting = ref(false)

  async function load () {
    loading.value = true
    loadError.value = null
    try {
      const fromId = toValue(fromTripId)
      const [graph, fromTrip] = await Promise.all([
        knowledgeGraphService.getKnowledgeGraph(),
        fromId ? tripsService.getById(fromId) : undefined
      ])
      companions.value = graph.nodes.flatMap(node => node.type === 'person' && node.role === EPersonRole.COMPANION
        ? [{ id: node.id, name: node.name }]
        : [])

      if (fromTrip) {
        const known = new Set(companions.value.map(companion => companion.id))
        Object.assign(state, {
          origin: fromTrip.origin,
          destination: fromTrip.destination,
          startDate: fromTrip.startDate,
          endDate: fromTrip.endDate,
          // People removed from the profile since can't go on a new trip
          companionIds: fromTrip.companionIds.filter(id => known.has(id)),
          notes: fromTrip.notes,
          whatsappOptIn: fromTrip.whatsappOptIn,
          whatsappNumber: fromTrip.whatsappNumber
        })
      }
    } catch (error) {
      loadError.value = getErrorMessage(error, 'Your profile couldn\'t be loaded. Try again.')
    } finally {
      loading.value = false
    }
  }

  watch(() => authStore.user?.homeCity, (homeCity) => {
    state.origin ??= homeCity
  })

  // Resolves to the server's field errors; on success the trip opens on its conversation
  async function submit (body: TCreateTripReq): Promise<FormError[]> {
    if (submitting.value) return []

    submitting.value = true
    try {
      const trip = await tripsService.createTrip(body)
      tripStore.setTrip(trip)
      await navigateTo({ name: 'trips-tripId-conversation', params: { tripId: trip.id } })

      return []
    } catch (error) {
      toast.add({ title: 'Couldn\'t send the request', description: getErrorMessage(error), color: 'error' })

      return getFormErrors(error)
    } finally {
      submitting.value = false
    }
  }

  onMounted(() => {
    load()
  })

  return { state, companions, loading, loadError, submitting, load, submit }
}

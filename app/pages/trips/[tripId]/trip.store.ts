import type { TTripRes } from '~~/shared/schemas/trips/TripResSchema'
import type { TUpdateTripDayReq } from '~~/shared/schemas/trips/UpdateTripDayReqSchema'
import { ETripStatus } from '~~/shared/schemas/trips/TripStatus'

const changed = (typed: string, saved: string | null) => typed.trim() !== (saved ?? '')

// Only what changed goes out, so a title the traveller didn't touch stays the planner's
const toDayUpdate = (day: TTripDayRes, draft: IDayDraft): TUpdateTripDayReq => ({
  ...(changed(draft.title, day.title) && { title: draft.title.trim() || null }),
  ...(changed(draft.note, day.note) && { note: draft.note.trim() || null }),
  removedItemIds: draft.removedItemIds,
  itemNotes: day.items
    .filter(item => !draft.removedItemIds.includes(item.id) && changed(draft.itemNotes[item.id] ?? '', item.note))
    .map(item => ({ itemId: item.id, note: draft.itemNotes[item.id]!.trim() || null }))
})

export const useTripStore = defineStore('trip', () => {
  const trip = ref<TTripRes>()
  const dayDraft = ref<IDayDraft | null>(null)
  const daySaving = ref(false)
  const daySaveError = ref<string | null>(null)

  const isPlanning = computed(() => trip.value?.status === ETripStatus.PLANNING)

  const draftDay = computed(() => trip.value?.days.find(day => day.id === dayDraft.value?.dayId))

  const dayUpdate = computed(() => draftDay.value && dayDraft.value ? toDayUpdate(draftDay.value, dayDraft.value) : null)

  const hasUnsavedDay = computed(() => Boolean(dayUpdate.value && (
    dayUpdate.value.title !== undefined ||
    dayUpdate.value.note !== undefined ||
    dayUpdate.value.removedItemIds.length > 0 ||
    dayUpdate.value.itemNotes.length > 0
  )))

  const unsavedDayLabel = computed(() => draftDay.value ? `Day ${draftDay.value.position + 1}` : '')

  async function fetchTrip (tripId: string) {
    trip.value = await tripsService.getById(tripId)
  }

  function setTrip (next: TTripRes) {
    trip.value = next
  }

  function reset () {
    trip.value = undefined
    dayDraft.value = null
    daySaveError.value = null
  }

  return {
    trip,
    dayDraft,
    daySaving,
    daySaveError,
    isPlanning,
    draftDay,
    dayUpdate,
    hasUnsavedDay,
    unsavedDayLabel,
    fetchTrip,
    setTrip,
    reset
  }
})

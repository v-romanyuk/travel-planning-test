import type { FormError } from '@nuxt/ui'

/** "Edit day": one day at a time, staged in the trip store, sent as one request on "Save day". */
export function useDayEditor () {
  const tripStore = useTripStore()
  const { dayDraft, draftDay, dayUpdate, daySaving, daySaveError } = storeToRefs(tripStore)
  const { confirmReplan } = useReplan()
  const toast = useToast()

  function start (day: TTripDayRes) {
    daySaveError.value = null
    dayDraft.value = {
      dayId: day.id,
      title: day.title ?? '',
      note: day.note ?? '',
      removedItemIds: [],
      itemNotes: Object.fromEntries(day.items.map(item => [item.id, item.note ?? '']))
    }
  }

  function cancel () {
    dayDraft.value = null
    daySaveError.value = null
  }

  function removeItem (itemId: string) {
    dayDraft.value?.removedItemIds.push(itemId)
  }

  function restoreItem (itemId: string) {
    if (!dayDraft.value) return
    dayDraft.value.removedItemIds = dayDraft.value.removedItemIds.filter(id => id !== itemId)
  }

  // Resolves to the server's field errors, for the form fields that caused them
  async function save (dayLabel: string): Promise<FormError[]> {
    const tripId = tripStore.trip?.id
    if (!tripId || !draftDay.value || !dayUpdate.value || daySaving.value) return []

    const dayId = draftDay.value.id
    daySaving.value = true
    daySaveError.value = null
    try {
      tripStore.setTrip(await tripsService.updateDay(tripId, dayId, dayUpdate.value))
      dayDraft.value = null
      toast.add({
        title: `${dayLabel} saved`,
        description: 'The planner reads this version the next time it runs.',
        color: 'success',
        duration: 10000,
        actions: [{ label: 'Re-plan with my changes', icon: 'icon:route', onClick: confirmReplan }]
      })

      return []
    } catch (error) {
      // The day stays in edit mode with everything typed
      daySaveError.value = getErrorMessage(error, 'The day couldn\'t be saved. Try again.')

      return getFormErrors(error)
    } finally {
      daySaving.value = false
    }
  }

  return { start, cancel, removeItem, restoreItem, save }
}

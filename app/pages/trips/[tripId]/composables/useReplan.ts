export function useReplan () {
  const tripStore = useTripStore()
  const { openModal } = useModals()
  const toast = useToast()

  const replanning = ref(false)

  async function replanNow () {
    const tripId = tripStore.trip?.id
    if (!tripId || replanning.value) return

    replanning.value = true
    try {
      tripStore.setTrip(await tripsService.replanTrip(tripId))
    } catch (error) {
      toast.add({ title: 'Couldn\'t start a re-plan', description: getErrorMessage(error), color: 'error' })
    } finally {
      replanning.value = false
    }
  }

  function confirmReplan () {
    openModal('AppConfirmModal', {
      title: 'Re-plan with your changes?',
      description: 'The planner makes a new plan from the trip as you edited it. Your current plan stays visible until the new one is ready. Nothing is booked or paid.',
      confirmLabel: 'Re-plan',
      confirmColor: 'primary',
      onConfirm: replanNow
    })
  }

  return { replanning, replanNow, confirmReplan }
}

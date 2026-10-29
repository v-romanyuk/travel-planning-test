<template>
  <div v-if="trip" class="flex flex-col gap-6 min-w-0">
    <!-- Only over a plan that is on screen and settled; while planning there is nothing to reassure about yet -->
    <NothingBookedNotice v-if="trip.planRun && !tripStore.isPlanning" />

    <PlanStateBlock :trip="trip" />

    <div v-if="trip.planRun" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
      <div class="flex flex-col gap-6 min-w-0">
        <section
          v-if="trip.planRun.unmetRequests.length"
          aria-label="Notes the plan doesn't follow"
          class="flex flex-col gap-2 px-4 py-3 rounded-xl border border-dashed border-ember-300 bg-default"
        >
          <h2 class="font-semibold text-highlighted">
            From your notes, not in this plan
          </h2>
          <ul class="flex flex-col gap-1.5">
            <li v-for="unmet in trip.planRun.unmetRequests" :key="unmet.request">
              <MissingFact>“{{ unmet.request }}”: {{ UNMET_REASON_LABELS[unmet.reason] }}</MissingFact>
            </li>
          </ul>
        </section>

        <ul v-if="tripGaps.length" class="flex flex-col gap-6" aria-label="Missing from the whole trip">
          <li
            v-for="(gap, index) in tripGaps"
            :key="index"
            class="px-4 py-3 rounded-xl border border-dashed border-ember-300 bg-default"
          >
            <MissingFact>{{ formatGap(gap) }}</MissingFact>
          </li>
        </ul>

        <TripPlanDay
          v-for="day in trip.days"
          :key="day.id"
          :day="day"
          :label="`Day ${day.position + 1}`"
          :gaps="gapsByDate.get(day.date) ?? []"
          :timeLabels="timeLabels"
          :editable="!tripStore.isPlanning"
        />
      </div>

      <PlanAside :trip="trip" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { RouteLocationNormalized } from 'vue-router'

import { EItemKind } from '~~/shared/schemas/trips/ItemKind'

useHead({ title: 'Plan' })

const tripStore = useTripStore()
const { trip } = storeToRefs(tripStore)
const editor = useDayEditor()
const { openModal } = useModals()

const tripGaps = computed(() => trip.value?.gaps.filter(gap => !gap.date) ?? [])
const gapsByDate = computed(() => Map.groupBy(trip.value?.gaps.filter(gap => gap.date) ?? [], gap => gap.date!))

// Transport departs; a stay is checked into on the first day it appears and out of on its last
const timeLabels = computed(() => {
  const labels: Record<string, string> = {}
  const stayItems = Map.groupBy(
    trip.value?.days.flatMap(day => day.items.filter(item => item.kind === EItemKind.STAY)) ?? [],
    item => item.source
  )
  trip.value?.days.forEach((day) => {
    day.items.forEach((item) => {
      if (item.kind === EItemKind.TRANSPORT) labels[item.id] = 'Departs'
    })
  })
  stayItems.forEach((items) => {
    if (items.length > 1) labels[items.at(-1)!.id] = 'Check-out'
    labels[items[0]!.id] = 'Check-in'
  })

  return labels
})

function confirmDiscard (to: RouteLocationNormalized) {
  openModal('AppConfirmModal', {
    title: `Discard changes to ${tripStore.unsavedDayLabel}?`,
    description: 'Your changes to this day haven\'t been saved.',
    confirmLabel: 'Discard',
    onConfirm: () => {
      editor.cancel()

      return navigateTo(to)
    }
  })
}

onBeforeRouteLeave((to) => {
  if (!tripStore.hasUnsavedDay) return true
  confirmDiscard(to)

  return false
})

useEventListener('beforeunload', (event) => {
  if (tripStore.hasUnsavedDay) event.preventDefault()
})

onUnmounted(editor.cancel)
</script>

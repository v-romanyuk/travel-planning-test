<template>
  <div class="flex flex-col gap-3 min-w-0">
    <TripStatusBadge :status="trip.status" class="self-start" />

    <div class="flex flex-wrap items-end justify-between gap-4">
      <h1 class="font-display font-bold text-4xl sm:text-6xl leading-none tracking-tight text-highlighted break-words min-w-0">
        {{ trip.destination.name }}
      </h1>
      <slot name="actions" />
    </div>

    <p class="text-muted break-words">
      {{ formatTripDates(trip.startDate, trip.endDate) }}, for {{ formatNames(trip.travellers.map(t => t.name)) }},
      starting from {{ trip.origin.name }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import type { TTripRes } from '~~/shared/schemas/trips/TripResSchema'

defineProps<{
  trip: TTripRes
}>()
</script>

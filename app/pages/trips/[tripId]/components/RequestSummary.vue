<template>
  <section aria-labelledby="request-title" class="flex flex-col gap-3.5 p-6 rounded-2xl bg-default border border-default min-w-0">
    <h2 id="request-title" class="font-display font-bold text-[22px] text-highlighted">
      Your request
    </h2>

    <dl class="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-5 gap-y-2 text-[15px]">
      <dt class="text-muted">
        From
      </dt>
      <dd class="font-semibold break-words">
        {{ trip.origin.label }}
      </dd>

      <dt class="text-muted">
        Destination
      </dt>
      <dd class="font-semibold break-words">
        {{ trip.destination.label }}
      </dd>

      <dt class="text-muted">
        Dates
      </dt>
      <dd class="font-semibold">
        {{ formatTripDates(trip.startDate, trip.endDate) }}
      </dd>

      <dt class="text-muted">
        Travellers
      </dt>
      <dd class="font-semibold break-words">
        {{ formatNames(trip.travellers.map(t => t.name)) }}
      </dd>

      <template v-if="trip.notes">
        <dt class="text-muted">
          Notes
        </dt>
        <dd class="font-semibold whitespace-pre-line break-words">
          {{ trip.notes }}
        </dd>
      </template>

      <template v-if="trip.whatsappOptIn && trip.whatsappNumber">
        <dt class="text-muted">
          WhatsApp
        </dt>
        <dd class="font-semibold tabular-nums">
          {{ trip.whatsappNumber }}
        </dd>
      </template>
    </dl>
  </section>
</template>

<script lang="ts" setup>
import type { TTripRes } from '~~/shared/schemas/trips/TripResSchema'

defineProps<{
  trip: TTripRes
}>()
</script>

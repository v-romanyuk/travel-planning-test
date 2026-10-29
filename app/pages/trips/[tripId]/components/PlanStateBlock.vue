<template>
  <PlanningAnimation
    v-if="trip.status === ETripStatus.PLANNING && !trip.planRun"
    :destination="trip.destination.name"
    :whatsappOptIn="trip.whatsappOptIn"
  />

  <section
    v-else-if="trip.status === ETripStatus.PLANNING"
    role="status"
    class="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-default border border-default"
  >
    <span aria-hidden="true" class="size-2.5 mt-2 shrink-0 rounded-full bg-primary motion-safe:animate-pulse" />
    <div>
      <h2 class="font-display font-bold text-lg text-highlighted">
        The planner is still working
      </h2>
      <p class="text-muted">
        The plan below is your previous one; it's replaced when the new one is ready.
        <template v-if="trip.whatsappOptIn">
          You'll get a WhatsApp message with this link when it's done.
        </template>
        You can close this page.
      </p>
    </div>
  </section>

  <section
    v-else-if="trip.status === ETripStatus.FAILED"
    class="flex flex-col gap-3 p-6 rounded-2xl bg-error/8 border border-error/25"
  >
    <h2 class="font-display font-bold text-2xl text-error">
      Planning failed
    </h2>
    <p v-if="trip.failureReason" class="break-words">
      {{ trip.failureReason }}
    </p>
    <p class="font-semibold">
      Nothing was booked or charged.
    </p>
    <div class="flex flex-wrap gap-2">
      <UButton color="error" :loading="replanning" @click="replanNow">
        Try again
      </UButton>
      <UButton color="neutral" variant="outline" :to="{ name: 'index', query: { from: trip.id } }">
        Change dates and try again
      </UButton>
      <UButton color="neutral" variant="ghost" :to="{ name: 'profile' }">
        Review your rules
      </UButton>
    </div>
  </section>

  <h2 v-if="trip.status === ETripStatus.FAILED && trip.planRun" class="font-display font-semibold text-xl text-muted">
    Showing your previous plan
  </h2>
</template>

<script lang="ts" setup>
import type { TTripRes } from '~~/shared/schemas/trips/TripResSchema'
import { ETripStatus } from '~~/shared/schemas/trips/TripStatus'

defineProps<{
  trip: TTripRes
}>()

const { replanning, replanNow } = useReplan()
</script>

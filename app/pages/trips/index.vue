<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <h1 class="font-display font-bold text-[44px] leading-tight tracking-tight text-highlighted">
        Your trips
      </h1>
      <UButton :to="{ name: 'index' }" icon="icon:plus">
        Plan a trip
      </UButton>
    </div>

    <div v-if="loading" role="status" aria-label="Loading your trips" class="flex flex-col gap-3">
      <USkeleton v-for="n in 3" :key="n" class="h-20 rounded-2xl" />
    </div>

    <UEmpty
      v-else-if="loadError"
      icon="icon:circle-help"
      title="Your trips couldn't be loaded"
      :description="loadError"
      variant="outline"
      class="bg-default rounded-2xl"
      :actions="[{ label: 'Try again', onClick: load }]"
    />

    <UEmpty
      v-else-if="!trips.length"
      icon="icon:map"
      title="No trips yet"
      description="Tell the planner where you're going. It plans in the background and never books or pays for anything."
      variant="outline"
      class="bg-default rounded-2xl"
      :actions="[{ label: 'Plan a trip', icon: 'icon:plus', to: { name: 'index' } }]"
    />

    <ul v-else class="flex flex-col gap-3">
      <li v-for="trip in trips" :key="trip.id">
        <NuxtLink
          :to="{ name: 'trips-tripId', params: { tripId: trip.id } }"
          class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-default border border-default
            hover:border-primary-300 focus-visible:outline-3 focus-visible:outline-primary-400 focus-visible:outline-offset-2"
        >
          <div class="min-w-0">
            <div class="font-display font-bold text-xl text-highlighted break-words">
              {{ trip.destination.name }}
            </div>
            <div class="text-sm text-muted">
              {{ formatTripDates(trip.startDate, trip.endDate) }}
            </div>
          </div>
          <TripStatusBadge :status="trip.status" />
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
useHead({ title: 'Trips' })

const { trips, loading, loadError, load } = useTripsList()
</script>

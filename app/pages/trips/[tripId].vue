<template>
  <div class="flex flex-col gap-6 min-w-0">
    <div v-if="loading" role="status" class="flex flex-col gap-3" aria-label="Loading the trip">
      <USkeleton class="h-7 w-24 rounded-full" />
      <USkeleton class="h-14 w-64 max-w-full" />
      <USkeleton class="h-5 w-96 max-w-full" />
      <span class="text-muted">Loading the trip…</span>
    </div>

    <UEmpty
      v-else-if="loadError"
      icon="icon:circle-help"
      title="This trip can't be shown"
      :description="loadError"
      variant="outline"
      class="bg-default rounded-2xl"
      :actions="[
        { label: 'Try again', onClick: load },
        { label: 'Your trips', color: 'neutral', variant: 'outline', to: { name: 'trips' } },
      ]"
    />

    <template v-else-if="trip">
      <!-- Stays put while the tab content scrolls under it -->
      <div class="sticky -top-4 z-20 -mx-5 -mt-8 px-5 pt-8 bg-muted flex flex-col gap-4">
        <TripHeader :trip="trip">
          <template v-if="showReplan" #actions>
            <UButton
              icon="icon:route"
              size="lg"
              :disabled="tripStore.hasUnsavedDay"
              :loading="replanning"
              @click="confirmReplan"
            >
              Re-plan with my changes
            </UButton>
          </template>
        </TripHeader>

        <UNavigationMenu :items="tabs" highlight class="border-b border-default" />
      </div>

      <NuxtPage />
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'

import { ETripStatus } from '~~/shared/schemas/trips/TripStatus'

const route = useRoute('trips-tripId')
const tripId = computed(() => route.params.tripId)
const router = useRouter()
// `route` is typed as the parent; the active child tab decides where the re-plan button shows
const isPlanTab = computed(() => router.currentRoute.value.name === 'trips-tripId-plan')

const tripStore = useTripStore()
const { trip } = storeToRefs(tripStore)
const { loading, loadError, load } = useTripLoader(tripId)
const { replanning, confirmReplan } = useReplan()

useHead({ title: () => trip.value ? `Trip to ${trip.value.destination.name}` : 'Trip' })

// A failed first run has nothing to re-plan from; its "Try again" lives in the failed card
const showReplan = computed(() => isPlanTab.value &&
  Boolean(trip.value?.planRun) &&
  trip.value?.status !== ETripStatus.PLANNING)

// Tabs are child routes, not local state: the WhatsApp link has to land on the plan tab directly
const tabs = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Conversation',
    icon: 'icon:messages-square',
    to: { name: 'trips-tripId-conversation', params: { tripId: tripId.value } }
  },
  { label: 'Plan', icon: 'icon:route', to: { name: 'trips-tripId-plan', params: { tripId: tripId.value } } }
])
</script>

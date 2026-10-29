<template>
  <KitSection title="Controls">
    <template #description>
      Nuxt UI components with the kit theme from <code>app.config.ts</code>. Use them as-is; reach for a custom
      component only for trip-specific pieces below.
    </template>

    <div class="flex flex-col gap-6 p-6 rounded-2xl bg-default border border-default">
      <div class="flex flex-wrap items-center gap-3">
        <UButton size="xl">
          Plan my trip
        </UButton>
        <UButton variant="outline" color="neutral" icon="icon:pencil">
          Edit day
        </UButton>
        <UButton variant="soft">
          Save address
        </UButton>
        <UButton variant="ghost" color="neutral">
          Cancel
        </UButton>
        <UButton variant="outline" color="error" icon="icon:trash-2">
          Remove from plan
        </UButton>
        <UButton loading>
          Saving
        </UButton>
        <UButton disabled>
          Plan my trip
        </UButton>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <TripStatusBadge :status="ETripStatus.READY" />
        <TripStatusBadge :status="ETripStatus.PLANNING" />
        <TripStatusBadge :status="ETripStatus.FAILED" />
        <UBadge color="primary" variant="soft">
          Planned
        </UBadge>
        <UBadge color="rule" variant="soft">
          Hard rule
        </UBadge>
        <UBadge color="neutral" variant="outline">
          Transport
        </UBadge>
      </div>

      <div class="grid sm:grid-cols-2 gap-x-5 gap-y-1">
        <UFormField label="Starting from" help="From your profile; changes apply to this trip only">
          <CitySelect v-model="origin" />
        </UFormField>
        <UFormField label="Destination">
          <UInput v-model="destination" size="xl" class="w-full" />
        </UFormField>
        <UFormField label="Area">
          <USelect v-model="domain" :items="domains" size="xl" class="w-full" />
        </UFormField>
        <UFormField label="WhatsApp number" error="Enter a number with a country code">
          <UInput model-value="7700 900123" type="tel" size="xl" class="w-full" />
        </UFormField>
        <UFormField label="Note for this day" class="sm:col-span-2">
          <UTextarea placeholder="For example: keep the morning free" :rows="3" class="w-full" />
        </UFormField>
      </div>

      <div class="flex flex-col gap-3">
        <UCheckbox v-model="optIn" label="Send me one WhatsApp message when the plan is ready, or if planning fails" />
        <URadioGroup v-model="kind" :items="kinds" />
      </div>

      <div class="flex flex-wrap gap-3">
        <UButton color="neutral" variant="outline" @click="showToast">
          Show toast
        </UButton>
        <UButton color="error" variant="outline" @click="confirmRemove">
          Open confirm modal
        </UButton>
      </div>
    </div>
  </KitSection>
</template>

<script lang="ts" setup>
import { ETripStatus } from '~~/shared/schemas/trips/TripStatus'
import { EPreferenceDomain } from '~~/shared/schemas/knowledge-graph/PreferenceDomain'
import { EPreferenceKind } from '~~/shared/schemas/knowledge-graph/PreferenceKind'
import type { TCity } from '~~/shared/schemas/cities/CitySchema'

const toast = useToast()
const { openModal } = useModals()

const origin = ref<TCity | undefined>({
  id: 756135,
  name: 'Warsaw',
  region: 'Mazovia',
  country: 'Poland',
  countryCode: 'PL',
  latitude: 52.22977,
  longitude: 21.01178,
  label: 'Warsaw, Mazovia, Poland'
})
const destination = ref('Lisbon')
const domain = ref(EPreferenceDomain.TRANSPORT)
const optIn = ref(true)
const kind = ref(EPreferenceKind.HARD_CONSTRAINT)

const domains = [
  { label: 'Stay', value: EPreferenceDomain.STAY },
  { label: 'Food', value: EPreferenceDomain.FOOD },
  { label: 'Transport', value: EPreferenceDomain.TRANSPORT }
]

const kinds = [
  { label: 'Hard rule', description: 'Options that break it are never suggested', value: EPreferenceKind.HARD_CONSTRAINT },
  { label: 'Preference', description: 'Matching options are ranked higher', value: EPreferenceKind.PREFERENCE }
]

const showToast = () => toast.add({
  title: 'Day 2 saved',
  description: 'The planner reads this version the next time it runs.',
  color: 'success'
})

const confirmRemove = () => {
  openModal('AppConfirmModal', {
    title: 'Remove this item?',
    description: 'MAAT will be removed from Day 2. The planner won\'t add it back on its next run.',
    confirmLabel: 'Remove from plan',
    onConfirm: () => toast.add({ title: 'Removed from plan', color: 'success' })
  })
}
</script>

<template>
  <UForm
    ref="form"
    :schema="CreateTripReqSchema"
    :state="state"
    class="flex flex-col gap-1"
    @submit="onSubmit"
  >
    <UFormField label="Starting from" name="origin" help="Your home city. Changing it here only affects this trip.">
      <CitySelect v-model="state.origin" />
    </UFormField>

    <UFormField label="Destination" name="destination">
      <CitySelect v-model="state.destination" icon="icon:map" />
    </UFormField>

    <UFormField label="Dates" name="dates" :errorPattern="/^(startDate|endDate)$/">
      <TripDateRangeInput v-model:start="state.startDate" v-model:end="state.endDate" />
    </UFormField>

    <TripRequestTravellers
      v-model="state.companionIds"
      :companions="companions"
      :loadError="loadError"
      @retry="load"
    />

    <UFormField label="Notes for the planner" name="notes" hint="Optional">
      <UTextarea
        v-model="notes"
        :rows="2"
        autoresize
        placeholder="For example: we like slow mornings"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="WhatsApp number"
      name="whatsappNumber"
      :help="state.whatsappOptIn ? 'International format, e.g. +48123456789' : 'Needed only for the message'"
    >
      <UInput
        v-model="whatsappNumber"
        type="tel"
        autocomplete="tel"
        placeholder="+48123456789"
        size="xl"
        class="w-full"
      />
    </UFormField>

    <UFormField name="whatsappOptIn">
      <UCheckbox
        v-model="state.whatsappOptIn"
        label="Send me one WhatsApp message when the plan is ready, or if planning fails. It only contains a link."
      />
    </UFormField>

    <UButton
      type="submit"
      size="xl"
      block
      :loading="submitting"
      :disabled="hasErrors || loading"
    >
      Plan my trip
    </UButton>
    <p class="mt-2 text-sm text-muted">
      The planner never books or pays for anything.
    </p>
  </UForm>
</template>

<script lang="ts" setup>
import type { FormError, FormErrorWithId, FormSubmitEvent } from '@nuxt/ui'

import { CreateTripReqSchema } from '~~/shared/schemas/trips/CreateTripReqSchema'
import type { TCreateTripReq } from '~~/shared/schemas/trips/CreateTripReqSchema'

const route = useRoute('index')
// Typed by hand: inferring it from the template is circular (the submit button inside the form reads it)
const form = useTemplateRef<{
  errors: FormErrorWithId[]
  setErrors: (errors: FormError[]) => void
  validate: (opts: { name: (keyof TCreateTripReq)[]; silent: boolean }) => Promise<unknown>
}>('form')

const fromTripId = computed(() => typeof route.query.from === 'string' ? route.query.from : undefined)
const { state, companions, loading, loadError, submitting, load, submit } = useTripRequestForm(fromTripId)

const hasErrors = computed<boolean>(() => Boolean(form.value?.errors.length))

// The schema takes null for "not given"; an emptied field must not fail the number format
const whatsappNumber = computed({
  get: () => state.whatsappNumber ?? '',
  set: (value: string) => { state.whatsappNumber = value.trim() ? value : null }
})
const notes = computed({
  get: () => state.notes ?? '',
  set: (value: string) => { state.notes = value.trim() ? value : null }
})

// The range picker isn't a form input, so a picked range must clear (or raise) the date errors itself
watch(() => [state.startDate, state.endDate], ([startDate, endDate]) => {
  if (startDate && endDate) form.value?.validate({ name: ['startDate', 'endDate'], silent: true })
})

// The number's "required" error depends on the opt-in, which isn't the number's input, so it would otherwise stay
// (and keep submit disabled) after opting out until the number field is blurred. Once shown, the toggle re-checks it both ways
let numberErrorShown = false
watch(() => state.whatsappOptIn, () => {
  numberErrorShown ||= Boolean(form.value?.errors.some(error => error.name === 'whatsappNumber'))
  if (numberErrorShown) form.value?.validate({ name: ['whatsappNumber'], silent: true })
})
// Same the other way: clearing the number must lift the opt-in's "tick this" error
watch(() => state.whatsappNumber, () => {
  if (form.value?.errors.some(error => error.name === 'whatsappOptIn')) {
    form.value.validate({ name: ['whatsappOptIn'], silent: true })
  }
})

async function onSubmit (event: FormSubmitEvent<TCreateTripReq>): Promise<void> {
  const fieldErrors = await submit(event.data)
  if (fieldErrors.length) form.value?.setErrors(fieldErrors)
}
</script>

<template>
  <UCard id="fact-form" class="scroll-mt-4">
    <UForm
      ref="form"
      :schema="CreateFactReqSchema"
      :state="draft"
      :disabled="factSaving"
      class="flex flex-col gap-1"
      @submit="onSubmit"
    >
      <h2 class="mb-3 font-display font-bold text-xl text-highlighted">
        Add to your profile
      </h2>

      <UFormField label="Applies to" name="subjectPersonId">
        <USelect
          v-model="subject"
          :items="subjectItems"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Area" name="domain">
        <USelect
          v-model="draft.domain"
          :items="[
            { label: 'Stay', value: EPreferenceDomain.STAY },
            { label: 'Food', value: EPreferenceDomain.FOOD },
            { label: 'Transport', value: EPreferenceDomain.TRANSPORT },
          ]"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Type" name="kind">
        <URadioGroup
          v-model="draft.kind"
          :items="[
            {
              label: 'Hard rule',
              description: 'Options that break it are never suggested',
              value: EPreferenceKind.HARD_CONSTRAINT,
            },
            {
              label: 'Preference',
              description: 'Matching options are ranked higher',
              value: EPreferenceKind.PREFERENCE,
            },
          ]"
        />
      </UFormField>

      <!-- Two lines under the field: the server's "couldn't check" messages are longer than one.
           The error hangs from the top of that space, so a one-line error stays next to the input -->
      <UFormField
        label="What is it?"
        name="value"
        :ui="{ root: 'pb-8.5', error: 'bottom-auto top-[calc(100%-var(--spacing)*8)] whitespace-normal line-clamp-2' }"
      >
        <UInput
          v-model="draft.value"
          placeholder="For example: no red-eye flights"
          maxlength="300"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <UButton
        type="submit"
        size="lg"
        class="self-start"
        :loading="factSaving"
        :disabled="!canSubmit"
      >
        {{ factSaving ? 'Checking…' : 'Add to profile' }}
      </UButton>
    </UForm>
  </UCard>
</template>

<script lang="ts" setup>
import type { FormError, FormErrorWithId } from '@nuxt/ui'

import { CreateFactReqSchema } from '~~/shared/schemas/knowledge-graph/CreateFactReqSchema'
import { EPreferenceDomain } from '~~/shared/schemas/knowledge-graph/PreferenceDomain'
import { EPreferenceKind } from '~~/shared/schemas/knowledge-graph/PreferenceKind'

const PARTY = 'party'

const profileStore = useProfileStore()
const { rows, draft, factSaving } = storeToRefs(profileStore)
const { submit } = useFactForm()

// Typed by hand: inferring it from the template is circular (the submit button inside the form reads it)
const form = useTemplateRef<{ errors: FormErrorWithId[]; setErrors: (errors: FormError[]) => void }>('form')

const subjectItems = computed(() => rows.value.map(row => ({
  label: row.tone === 'party' ? 'Everyone on the trip' : row.tone === 'traveller' ? `${row.name} (you)` : row.name,
  value: row.id
})))

// The select can't hold null, so "Everyone" travels as the party node's id
const subject = computed({
  get: () => draft.value.subjectPersonId ?? PARTY,
  set: (value: string) => {
    draft.value.subjectPersonId = value === PARTY ? null : value
  }
})

const canSubmit = computed(() => !factSaving.value && !form.value?.errors.length && Boolean(draft.value.value.trim()))

async function onSubmit () {
  const fieldErrors = await submit()
  if (fieldErrors.length) form.value?.setErrors(fieldErrors)
}
</script>

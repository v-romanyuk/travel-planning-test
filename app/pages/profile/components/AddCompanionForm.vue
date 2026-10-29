<template>
  <UForm
    ref="form"
    :schema="CreatePersonReqSchema"
    :state="state"
    class="flex flex-col gap-1"
    @submit="onSubmit"
  >
    <h3 class="font-semibold text-highlighted">
      Add a companion
    </h3>
    <div class="flex items-start gap-2">
      <UFormField name="name" class="flex-1 min-w-0">
        <UInput
          v-model="state.name"
          aria-label="Companion's name"
          placeholder="Their name"
          maxlength="100"
          size="lg"
          class="w-full"
        />
      </UFormField>
      <UButton
        type="submit"
        size="lg"
        icon="icon:plus"
        :loading="adding"
      >
        Add
      </UButton>
    </div>
  </UForm>
</template>

<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'

import { CreatePersonReqSchema } from '~~/shared/schemas/knowledge-graph/CreatePersonReqSchema'
import type { TCreatePersonReq } from '~~/shared/schemas/knowledge-graph/CreatePersonReqSchema'

const { adding, add } = useAddCompanion()

const form = useTemplateRef('form')
const state = reactive({ name: '' })

async function onSubmit (event: FormSubmitEvent<TCreatePersonReq>) {
  if (!await add(event.data.name)) return

  state.name = ''
  form.value?.clear()
}
</script>

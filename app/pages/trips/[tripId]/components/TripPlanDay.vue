<template>
  <UForm
    ref="form"
    :schema="schema"
    :state="editing ? dayDraft! : {}"
    :aria-label="`${label}, ${formatDayDate(day.date)}`"
    @submit="onSave"
  >
    <PlanDay :label="label" :date="formatDayDate(day.date)" :title="editing ? undefined : day.title ?? undefined">
      <template #actions>
        <div v-if="editing" class="flex flex-wrap gap-2">
          <UButton type="submit" :loading="daySaving" :disabled="hasErrors">
            Save day
          </UButton>
          <UButton color="neutral" variant="ghost" :disabled="daySaving" @click="editor.cancel">
            Cancel
          </UButton>
        </div>
        <UButton
          v-else-if="editable && !dayDraft"
          variant="outline"
          color="neutral"
          icon="icon:pencil"
          @click="editor.start(day)"
        >
          Edit day
        </UButton>
      </template>

      <template #before>
        <UFormField v-if="editing" label="Day title" name="title" help="Leave empty to let the planner name the day">
          <UInput v-model="dayDraft!.title" size="lg" class="w-full" />
        </UFormField>
      </template>

      <TripPlanDayItem
        v-for="item in day.items"
        :key="item.id"
        :item="item"
        :timeLabel="timeLabels[item.id]"
        :editing="editing"
        :removed="removedItemIds.includes(item.id)"
      />

      <li v-for="(gap, index) in gaps" :key="`gap-${index}`" class="relative">
        <span
          aria-hidden="true"
          class="absolute top-5 left-[-26px] -translate-x-1/2 size-3 rounded-full
            border-2 border-dashed border-ember-500 bg-default"
        />
        <div class="px-4.5 py-3.5 rounded-2xl border border-dashed border-ember-300 bg-default">
          <MissingFact>{{ formatGap(gap) }}</MissingFact>
        </div>
      </li>

      <li v-if="!day.items.length && !gaps.length" class="text-muted italic py-2">
        Nothing planned for this day
      </li>

      <template #after>
        <PlanDayNote v-if="!editing && day.note">
          {{ day.note }}
        </PlanDayNote>

        <div v-if="editing" class="flex flex-col gap-1">
          <UFormField label="Note for this day" name="note">
            <UTextarea
              v-model="dayDraft!.note"
              :rows="3"
              autoresize
              placeholder="For example: keep the morning free"
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="daySaveError"
            color="error"
            variant="soft"
            title="The day wasn't saved"
            :description="daySaveError"
            class="mb-3"
          />

          <div class="flex flex-wrap gap-2">
            <UButton type="submit" :loading="daySaving" :disabled="hasErrors">
              Save day
            </UButton>
            <UButton color="neutral" variant="ghost" :disabled="daySaving" @click="editor.cancel">
              Cancel
            </UButton>
          </div>
        </div>
      </template>
    </PlanDay>
  </UForm>
</template>

<script lang="ts" setup>
import { z } from 'zod'

import { UpdateTripDayReqSchema } from '~~/shared/schemas/trips/UpdateTripDayReqSchema'

const { day, label, editable } = defineProps<{
  day: TTripDayRes
  label: string
  gaps: TTripGapRes[]
  timeLabels: Record<string, string>
  editable: boolean
}>()

const tripStore = useTripStore()
const { dayDraft, daySaving, daySaveError } = storeToRefs(tripStore)
const editor = useDayEditor()
const form = useTemplateRef('form')

// Same limits as the server's request schema; item notes are keyed by item id here
const schema = z.object({
  title: UpdateTripDayReqSchema.shape.title,
  note: UpdateTripDayReqSchema.shape.note,
  itemNotes: z.record(z.string(), UpdateTripDayReqSchema.shape.itemNotes.unwrap().element.shape.note)
})

const editing = computed(() => editable && dayDraft.value?.dayId === day.id)
const hasErrors = computed<boolean>(() => Boolean(form.value?.errors.length))

const removedItemIds = computed(() => editing.value ? dayDraft.value!.removedItemIds : [])

async function onSave () {
  const fieldErrors = await editor.save(label)
  if (fieldErrors.length) form.value?.setErrors(fieldErrors)
}
</script>

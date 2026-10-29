<template>
  <PlanTrailItem :kind="item.kind">
    <div
      v-if="removed"
      class="flex flex-wrap items-center justify-between gap-2 px-4.5 py-3
        rounded-2xl border border-dashed border-muted bg-default"
    >
      <span class="min-w-0 break-words text-muted">
        <s class="font-display font-semibold text-highlighted">{{ item.name }}</s> · Removed from plan
      </span>
      <UButton
        variant="ghost"
        color="neutral"
        icon="icon:undo-2"
        :aria-label="`Undo removing ${item.name}`"
        @click="editor.restoreItem(item.id)"
      >
        Undo
      </UButton>
    </div>
    <PlanItemCard v-else :item="item" :timeLabel="timeLabel">
      <PlanDayNote v-if="!editing && item.note">
        {{ item.note }}
      </PlanDayNote>

      <template v-if="editing" #actions>
        <div class="flex flex-col gap-1">
          <UFormField label="Note on this item" :name="`itemNotes.${item.id}`">
            <UTextarea v-model="dayDraft!.itemNotes[item.id]" :rows="2" autoresize class="w-full" />
          </UFormField>
          <UButton
            variant="outline"
            color="error"
            icon="icon:trash-2"
            class="self-start"
            @click="editor.removeItem(item.id)"
          >
            Remove from plan
          </UButton>
        </div>
      </template>
    </PlanItemCard>
  </PlanTrailItem>
</template>

<script lang="ts" setup>
defineProps<{
  item: TTripItemRes
  timeLabel?: string
  editing: boolean
  // Staged in the day draft; nothing is removed until "Save day"
  removed?: boolean
}>()

const { dayDraft } = storeToRefs(useTripStore())
const editor = useDayEditor()
</script>

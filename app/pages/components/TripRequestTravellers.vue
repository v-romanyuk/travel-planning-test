<template>
  <UFormField label="Who's going" name="companionIds">
    <div class="flex flex-col gap-2">
      <div class="flex items-center min-h-11 px-3.5 rounded-xl border border-default">
        <UCheckbox :modelValue="true" disabled :label="`${authStore.user?.fullName ?? 'You'} (you)`" />
      </div>

      <UAlert
        v-if="loadError"
        color="error"
        variant="soft"
        title="Couldn't load your companions"
        :description="loadError"
        :actions="[{ label: 'Try again', color: 'error', variant: 'outline', onClick: () => emit('retry') }]"
      />

      <!-- A wrapping <label> makes the whole card toggle: the checkbox button is its first labelable child -->
      <label
        v-for="companion in companions"
        v-else
        :key="companion.id"
        class="flex items-center gap-2 min-h-11 px-3.5 rounded-xl border border-default cursor-pointer
          hover:bg-elevated/50 transition-colors"
      >
        <UCheckbox
          :modelValue="model.includes(companion.id)"
          @update:model-value="toggle(companion.id, $event === true)"
        />
        <span class="min-w-0 break-words text-sm font-medium text-default">{{ companion.name }}</span>
      </label>

      <ULink :to="{ name: 'profile' }" class="text-sm font-semibold text-primary self-start">
        Edit people in your profile
      </ULink>
    </div>
  </UFormField>
</template>

<script lang="ts" setup>
const model = defineModel<string[]>({ required: true })

defineProps<{
  companions: { id: string; name: string }[]
  loadError: string | null
}>()

const emit = defineEmits<{
  retry: []
}>()

const authStore = useAuthStore()

function toggle (id: string, checked: boolean) {
  model.value = checked ? [...model.value, id] : model.value.filter(companionId => companionId !== id)
}
</script>

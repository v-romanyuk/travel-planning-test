<template>
  <div class="flex items-center gap-3 min-w-0">
    <div
      aria-hidden="true"
      class="size-13 shrink-0 rounded-full flex items-center justify-center font-display font-bold text-lg"
      :class="tones[tone]"
    >
      {{ initials }}
    </div>
    <div class="min-w-0">
      <div class="font-semibold text-[17px] text-highlighted break-words">
        {{ name }}
      </div>
      <div class="text-[13px] text-muted break-words">
        {{ role }}
      </div>
    </div>
    <UButton
      v-if="removable"
      icon="icon:trash-2"
      color="neutral"
      variant="ghost"
      class="shrink-0"
      :aria-label="`Remove ${name}`"
      @click="emit('remove')"
    />
  </div>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
  name: string
  role: string
  initials: string
  tone?: TPersonTone
  removable?: boolean
}>(), {
  tone: 'companion'
})

const emit = defineEmits<{
  remove: []
}>()

const tones: Record<TPersonTone, string> = {
  party: 'bg-inverted text-inverted',
  traveller: 'bg-primary text-inverted',
  companion: 'bg-primary-100 text-primary-900'
}
</script>

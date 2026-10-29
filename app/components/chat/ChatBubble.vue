<template>
  <div
    v-if="from === 'traveller'"
    class="self-end max-w-[80%] px-4 py-3.5 rounded-[18px_18px_4px_18px] bg-primary-100 text-highlighted"
  >
    <slot />
  </div>

  <div v-else class="flex items-start gap-3 max-w-[88%]">
    <div
      aria-hidden="true"
      class="size-9 shrink-0 rounded-full flex items-center justify-center text-inverted"
      :class="failed ? 'bg-error' : 'bg-primary'"
    >
      <Icon name="logo" class="size-5" />
    </div>
    <div
      class="flex flex-col items-start gap-3 px-4 py-3.5 rounded-[4px_18px_18px_18px] border"
      :class="failed ? 'bg-error/8 border-error/25' : 'bg-muted border-muted'"
    >
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  from: 'traveller' | 'agent'
  failed?: boolean
}>()
</script>

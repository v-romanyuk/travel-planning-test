<template>
  <UBadge :color="config.color" variant="soft" size="lg">
    <span class="size-2 rounded-full" :class="config.dot" />
    {{ config.label }}
  </UBadge>
</template>

<script lang="ts" setup>
import { ETripStatus } from '~~/shared/schemas/trips/TripStatus'

const { status } = defineProps<{
  status: ETripStatus
}>()

const configs = {
  [ETripStatus.PLANNING]: { label: 'Planning', color: 'neutral', dot: 'bg-primary-400 motion-safe:animate-pulse' },
  [ETripStatus.READY]: { label: 'Ready', color: 'primary', dot: 'bg-primary' },
  [ETripStatus.FAILED]: { label: 'Failed', color: 'error', dot: 'bg-error' }
} as const

const config = computed(() => configs[status])
</script>

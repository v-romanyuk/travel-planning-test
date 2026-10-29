<template>
  <span
    aria-hidden="true"
    class="block box-border ring-4 ring-(--ui-bg-muted)"
    :class="shapes[kind]"
  />
</template>

<script lang="ts" setup>
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'

defineProps<{
  kind: EItemKind
}>()

// Shape, not colour, carries the kind: stay = filled square, place = ring, transport = diamond
const shapes: Record<EItemKind, string> = {
  [EItemKind.STAY]: 'size-4 rounded-[4px] bg-primary',
  [EItemKind.PLACE]: 'size-3.5 rounded-full bg-default border-3 border-primary',
  [EItemKind.TRANSPORT]: 'size-3 rotate-45 bg-default border-3 border-primary'
}
</script>

<template>
  <li class="relative">
    <PlanItemMarker :kind="kind" class="absolute top-5 -translate-x-1/2 left-[-26px]" />
    <slot />
  </li>
</template>

<script lang="ts" setup>
import type { EItemKind } from '~~/shared/schemas/trips/ItemKind'

defineProps<{
  kind: EItemKind
}>()
</script>

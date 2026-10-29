<template>
  <div aria-hidden="true" class="relative max-w-full" :class="compact ? 'w-28 h-5' : 'w-60 h-8'">
    <span class="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-primary-300" />

    <!-- Delays line each pop up with the dot's forward pass (see trail-walk / trail-stop in main.css) -->
    <span class="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2">
      <span class="block motion-safe:animate-trail-stop [animation-delay:-0.36s]">
        <PlanItemMarker :kind="EItemKind.TRANSPORT" />
      </span>
    </span>
    <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <span class="block motion-safe:animate-trail-stop [animation-delay:0.45s]">
        <PlanItemMarker :kind="EItemKind.STAY" />
      </span>
    </span>
    <span class="absolute top-1/2 left-full -translate-x-1/2 -translate-y-1/2">
      <span class="block motion-safe:animate-trail-stop [animation-delay:1.26s]">
        <PlanItemMarker :kind="EItemKind.PLACE" />
      </span>
    </span>

    <span
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary motion-safe:animate-trail-walk"
      :class="compact ? 'size-3 ring-2 ring-primary-100' : 'size-4 ring-4 ring-primary-100'"
    />
  </div>
</template>

<script lang="ts" setup>
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'

defineProps<{
  // The chat-bubble size; the default is the plan tab's centrepiece
  compact?: boolean
}>()
</script>

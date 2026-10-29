<template>
  <section class="flex flex-col gap-5">
    <div>
      <h2 class="font-display font-bold text-2xl text-highlighted">
        {{ title }}
      </h2>
      <p v-if="$slots.description" class="text-muted max-w-[65ch]">
        <slot name="description" />
      </p>
    </div>
    <slot />
  </section>
</template>

<script lang="ts" setup>
defineProps<{
  title: string
}>()
</script>

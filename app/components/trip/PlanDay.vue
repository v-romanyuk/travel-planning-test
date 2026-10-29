<template>
  <section class="flex flex-col gap-5">
    <div class="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b-2 border-inverted">
      <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 class="font-display font-bold text-3xl tracking-tight text-highlighted">
          {{ label }}
        </h2>
        <span class="font-medium text-muted">{{ date }}</span>
        <span v-if="title" class="font-display font-semibold text-xl text-primary">{{ title }}</span>
      </div>

      <slot name="actions" />
    </div>

    <slot name="before" />

    <ol class="relative flex flex-col gap-3.5 pl-10">
      <li aria-hidden="true" class="absolute left-[13px] top-5 bottom-5 w-0.5 bg-primary-200" />
      <slot />
    </ol>

    <slot name="after" />
  </section>
</template>

<script lang="ts" setup>
defineProps<{
  label: string
  date: string
  title?: string
}>()
</script>

<template>
  <section role="status" class="flex flex-col items-center justify-center gap-10 min-h-[50vh] py-12 text-center">
    <PlanningTrail />

    <div class="flex flex-col gap-2 max-w-[46ch]">
      <h2 class="font-display font-bold text-3xl tracking-tight text-highlighted">
        Planning your trip to {{ destination }}
      </h2>
      <p class="text-muted">
        The planner is searching the catalogue and checking your rules.
        <template v-if="whatsappOptIn">
          You'll get a WhatsApp message with this link when it's done.
        </template>
        You can close this page.
      </p>
    </div>
  </section>
</template>

<script lang="ts" setup>
defineProps<{
  destination: string
  whatsappOptIn: boolean
}>()
</script>

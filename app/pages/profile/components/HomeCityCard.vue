<template>
  <UCard>
    <div class="flex flex-col gap-1">
      <h2 class="font-display font-bold text-xl text-highlighted">
        Home city
      </h2>
      <p class="mb-3 text-sm text-muted">
        Every trip starts here unless you pick another starting point when you plan.
      </p>

      <UFormField name="homeCity" :help="saved && !changed ? 'Saved. New trips start from here.' : undefined">
        <CitySelect v-model="picked" aria-label="Home city" />
      </UFormField>

      <UButton
        size="lg"
        class="self-start"
        :loading="saving"
        :disabled="!changed"
        @click="save"
      >
        Save home city
      </UButton>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
const { picked, saving, saved, changed, save } = useHomeCityForm()
</script>

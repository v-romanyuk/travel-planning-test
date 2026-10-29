<template>
  <UInput
    v-model="model"
    :type="visible ? 'text' : 'password'"
    size="xl"
    class="w-full"
    :ui="{ trailing: 'pe-1' }"
  >
    <template #trailing>
      <UButton
        color="neutral"
        variant="link"
        size="sm"
        :icon="visible ? 'icon:eye-off' : 'icon:eye'"
        :aria-label="visible ? 'Hide password' : 'Show password'"
        :aria-pressed="visible"
        @click="visible = !visible"
      />
    </template>
  </UInput>
</template>

<script lang="ts" setup>
const model = defineModel<string>({ required: true })

const visible = ref(false)
</script>

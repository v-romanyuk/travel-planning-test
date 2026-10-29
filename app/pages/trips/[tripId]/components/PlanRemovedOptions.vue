<template>
  <div class="text-sm break-words">
    Removed {{ names.length }} {{ names.length === 1 ? 'option' : 'options' }}:
    <template v-if="hidden && !expanded">
      {{ names.slice(0, VISIBLE).join(', ') }} and
      <button type="button" class="font-semibold text-primary underline-offset-2 hover:underline" @click="expanded = true">
        {{ hidden }} more
      </button>.
    </template>
    <template v-else>
      {{ formatNames(names) }}.
      <button
        v-if="hidden"
        type="button"
        class="font-semibold text-primary underline-offset-2 hover:underline"
        @click="expanded = false"
      >
        Show fewer
      </button>
    </template>
  </div>
</template>

<script lang="ts" setup>
const VISIBLE = 5

const { names } = defineProps<{
  names: string[]
}>()

const expanded = ref(false)
const hidden = computed(() => Math.max(names.length - VISIBLE, 0))
</script>

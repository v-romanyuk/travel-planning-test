<template>
  <div v-if="trip" class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start">
    <RequestSummary :trip="trip" />
    <ConversationThread :trip="trip" />
  </div>
</template>

<script lang="ts" setup>
useHead({ title: 'Conversation' })

const { trip } = storeToRefs(useTripStore())
</script>

<template>
  <li class="flex flex-wrap items-stretch gap-y-3">
    <PersonNode
      :name="row.name"
      :role="row.role"
      :initials="row.initials"
      :tone="row.tone"
      :removable="row.tone === 'companion'"
      class="basis-60 shrink-0 py-3 pr-4"
      @remove="emit('removePerson')"
    />
    <div class="flex-1 basis-72 min-w-0 flex flex-col gap-2.5 pl-4 sm:pl-6 border-l-2 border-default">
      <ProfileFactCard
        v-for="fact in row.facts"
        :id="`fact-${fact.id}`"
        :key="fact.id"
        :kind="fact.kind"
        :domain="fact.domain"
        :value="fact.value"
        :ruleStatus="fact.ruleStatus"
        :ruleSummary="fact.ruleSummary"
        connected
        removable
        @remove="emit('removeFact', fact)"
      />
      <p v-if="!row.facts.length" class="py-3 text-muted italic">
        Nothing stored yet.
      </p>
    </div>
  </li>
</template>

<script lang="ts" setup>
defineProps<{
  row: IProfileRow
}>()

const emit = defineEmits<{
  removeFact: [fact: TProfileFact]
  removePerson: []
}>()
</script>

<template>
  <p v-if="ruleStatus === ERuleStatus.COMPILED" class="text-[13px] text-muted break-words">
    Read as: {{ ruleSummary }}
  </p>
  <div v-else class="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-[13px] text-muted">
    <UBadge color="neutral" variant="outline" size="sm">
      Not guaranteed
    </UBadge>
    <span class="min-w-0 break-words">
      We can't check this one automatically, so the planner may not always follow it.
    </span>
  </div>
</template>

<script lang="ts" setup>
import { ERuleStatus } from '~~/shared/schemas/knowledge-graph/RuleStatus'

defineProps<{
  ruleStatus: ERuleStatus
  ruleSummary: string | null
}>()
</script>

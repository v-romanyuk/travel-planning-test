<template>
  <div
    class="flex flex-col gap-0.5 p-3 rounded-xl border"
    :class="isRule ? 'bg-ember-100 border-ember-200' : 'bg-primary-50 border-dashed border-primary-300'"
  >
    <div class="font-semibold text-highlighted break-words">
      {{ value }}
    </div>
    <div v-if="subjectName && domain" class="text-[13px]" :class="isRule ? 'text-ember-800' : 'text-primary-800'">
      {{ subjectName }}, {{ DOMAIN_LABELS[domain] }}
    </div>
    <div v-if="notGuaranteed" class="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-[13px] text-muted">
      <UBadge color="neutral" variant="outline" size="sm">
        Not guaranteed
      </UBadge>
      <span class="min-w-0 break-words">
        We couldn't check this for sure, so the planner went by each option's description.
      </span>
    </div>
    <slot />
  </div>
</template>

<script lang="ts" setup>
import type { EPreferenceDomain } from '~~/shared/schemas/knowledge-graph/PreferenceDomain'
import { EPreferenceKind } from '~~/shared/schemas/knowledge-graph/PreferenceKind'

const { kind } = defineProps<{
  kind: EPreferenceKind
  value: string
  // Missing on runs planned before the snapshot carried them
  subjectName?: string
  domain?: EPreferenceDomain
  notGuaranteed?: boolean
}>()

const isRule = computed(() => kind === EPreferenceKind.HARD_CONSTRAINT)
</script>

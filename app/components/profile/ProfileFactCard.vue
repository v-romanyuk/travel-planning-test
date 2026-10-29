<template>
  <div class="flex items-center">
    <span
      v-if="connected"
      aria-hidden="true"
      class="w-8 shrink-0 border-t-3"
      :class="isRule ? 'border-ember-500' : 'border-dashed border-primary-500'"
    />
    <div
      class="flex-1 min-w-0 flex flex-col gap-1 py-3 pl-4 pr-3 rounded-2xl border"
      :class="isRule ? 'bg-ember-100 border-ember-200' : 'bg-primary-50 border-primary-200'"
    >
      <div class="flex items-start gap-2">
        <div class="flex-1 min-w-0 font-semibold text-highlighted break-words">
          {{ value }}
        </div>
        <!-- Negative margin centres the 28px button on the title's 24px first line -->
        <UButton
          v-if="removable"
          icon="icon:x"
          color="neutral"
          variant="ghost"
          size="sm"
          class="shrink-0 -my-0.5"
          :disabled="removeDisabled"
          :aria-label="`Remove ${value}`"
          @click="emit('remove')"
        />
      </div>
      <div class="text-[13px]" :class="isRule ? 'text-ember-800' : 'text-primary-800'">
        {{ isRule ? 'Hard rule' : 'Preference' }} for {{ domain }}<template v-if="subject">, {{ subject }}</template>
      </div>
      <FactReadBack
        v-if="ruleStatus"
        :ruleStatus="ruleStatus"
        :ruleSummary="ruleSummary ?? null"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { EPreferenceKind } from '~~/shared/schemas/knowledge-graph/PreferenceKind'
import type { EPreferenceDomain } from '~~/shared/schemas/knowledge-graph/PreferenceDomain'
import type { ERuleStatus } from '~~/shared/schemas/knowledge-graph/RuleStatus'

const { kind } = defineProps<{
  kind: EPreferenceKind
  domain: EPreferenceDomain
  value: string
  subject?: string
  ruleStatus?: ERuleStatus
  ruleSummary?: string | null
  connected?: boolean
  removable?: boolean
  removeDisabled?: boolean
}>()

const emit = defineEmits<{
  remove: []
}>()

const isRule = computed(() => kind === EPreferenceKind.HARD_CONSTRAINT)
</script>

<template>
  <KitSection title="Profile and knowledge graph">
    <template #description>
      A person node connects to their facts. A solid ember line is a hard rule, a dashed green line is a preference.
      Each fact shows how the planner read it, or that it can't be checked.
    </template>

    <div class="flex flex-col gap-6 p-6 rounded-2xl bg-default border border-default">
      <div class="flex flex-wrap gap-8">
        <PersonNode name="Everyone" role="Olena and Taras" initials="O+T" tone="party" />
        <PersonNode name="Olena Kovalenko" role="You, the traveller" initials="OK" tone="traveller" />
        <PersonNode name="Taras" role="Travels with Olena" initials="T" removable />
      </div>

      <div class="flex flex-wrap items-stretch gap-y-3">
        <PersonNode name="Everyone" role="Olena and Taras" initials="O+T" tone="party" class="basis-60 shrink-0 py-3 pr-4" />
        <div class="flex-1 basis-72 min-w-0 flex flex-col gap-2.5 pl-6 border-l-2 border-default">
          <ProfileFactCard
            v-for="fact in facts"
            :key="fact.value"
            :kind="fact.kind"
            :domain="fact.domain"
            :value="fact.value"
            :ruleStatus="fact.ruleStatus"
            :ruleSummary="fact.ruleSummary"
            connected
            removable
          />
        </div>
      </div>

      <div class="flex flex-wrap items-stretch gap-y-3">
        <PersonNode name="Taras" role="Travels with Olena" initials="T" removable class="basis-60 shrink-0 py-3 pr-4" />
        <div class="flex-1 basis-72 min-w-0 flex flex-col gap-2.5 pl-6 border-l-2 border-default">
          <p class="py-3 text-muted italic">
            Nothing stored yet.
          </p>
        </div>
      </div>

      <ProfileFactCard
        :kind="EPreferenceKind.PREFERENCE"
        :domain="EPreferenceDomain.STAY"
        value="Quiet, walkable neighbourhood"
        subject="Olena"
      />
    </div>
  </KitSection>
</template>

<script lang="ts" setup>
import { EPreferenceDomain } from '~~/shared/schemas/knowledge-graph/PreferenceDomain'
import { EPreferenceKind } from '~~/shared/schemas/knowledge-graph/PreferenceKind'
import { ERuleStatus } from '~~/shared/schemas/knowledge-graph/RuleStatus'

const facts = [
  {
    kind: EPreferenceKind.HARD_CONSTRAINT,
    domain: EPreferenceDomain.TRANSPORT,
    value: 'No red-eye flights',
    ruleStatus: ERuleStatus.COMPILED,
    ruleSummary: 'Removes flights departing 22:00–05:59'
  },
  {
    kind: EPreferenceKind.PREFERENCE,
    domain: EPreferenceDomain.TRANSPORT,
    value: 'Direct flights',
    ruleStatus: ERuleStatus.COMPILED,
    ruleSummary: 'Ranks flights with no stops higher'
  },
  {
    kind: EPreferenceKind.HARD_CONSTRAINT,
    domain: EPreferenceDomain.STAY,
    value: 'No hotels near the airport',
    ruleStatus: ERuleStatus.UNENFORCEABLE,
    ruleSummary: null
  }
]
</script>

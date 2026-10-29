<template>
  <aside aria-label="How this plan was made" class="flex flex-col gap-6 min-w-0">
    <section class="flex flex-col gap-3 p-5 rounded-2xl bg-default border border-default">
      <h2 class="font-display font-bold text-xl text-highlighted">
        Where the facts come from
      </h2>
      <p class="text-sm text-muted">
        Each place, time and price comes from the catalogue entry shown under it. When the catalogue doesn't have a
        fact, the plan says so instead of guessing.
      </p>
      <div class="flex flex-wrap gap-4 text-sm">
        <span v-for="kind in Object.values(EItemKind)" :key="kind" class="inline-flex items-center gap-2">
          <PlanItemMarker :kind="kind" />
          {{ ITEM_KIND_LABELS[kind] }}
        </span>
      </div>
    </section>

    <section class="flex flex-col gap-3 p-5 rounded-2xl bg-default border border-default">
      <h2 class="font-display font-bold text-xl text-highlighted">
        Rules applied
      </h2>
      <p class="text-sm text-muted">
        Options that break a rule are removed before ranking.
      </p>

      <PlanFactCard
        v-for="rule in rules"
        :key="rule.id"
        :kind="EPreferenceKind.HARD_CONSTRAINT"
        :value="rule.value"
        :subjectName="rule.subjectName"
        :domain="rule.domain"
      >
        <PlanRemovedOptions :names="rule.names" />
      </PlanFactCard>
      <PlanFactCard
        v-for="fact in unverifiedRules"
        :key="fact.id"
        :kind="fact.kind"
        :value="fact.value"
        :subjectName="fact.subjectName"
        :domain="fact.domain"
        notGuaranteed
      />
      <p v-if="!rules.length && !unverifiedRules.length" class="text-sm">
        No rule removed an option for this plan.
      </p>
    </section>

    <section class="flex flex-col gap-3 p-5 rounded-2xl bg-default border border-default">
      <h2 class="font-display font-bold text-xl text-highlighted">
        Preferences used
      </h2>
      <p class="text-sm text-muted">
        Preferences change the order, never what's allowed.
      </p>

      <PlanFactCard
        v-for="preference in preferences"
        :key="preference.id"
        :kind="EPreferenceKind.PREFERENCE"
        :value="preference.value"
        :subjectName="preference.subjectName"
        :domain="preference.domain"
        :notGuaranteed="!preference.checkedByCode"
      >
        <div class="text-sm break-words">
          Cited by {{ formatNames(preference.names) }}.
        </div>
      </PlanFactCard>
      <PlanFactCard
        v-for="fact in unverifiedPreferences"
        :key="fact.id"
        :kind="fact.kind"
        :value="fact.value"
        :subjectName="fact.subjectName"
        :domain="fact.domain"
        notGuaranteed
      />
      <p v-if="!preferences.length && !unverifiedPreferences.length" class="text-sm">
        No item in this plan cites a stored preference.
      </p>

      <ULink :to="{ name: 'profile' }" class="text-sm font-semibold text-primary self-start">
        See your profile
      </ULink>
    </section>
  </aside>
</template>

<script lang="ts" setup>
import type { TTripRes } from '~~/shared/schemas/trips/TripResSchema'
import { EPreferenceKind } from '~~/shared/schemas/knowledge-graph/PreferenceKind'
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'

const { trip } = defineProps<{
  trip: TTripRes
}>()

// Grouping and counting only: the aside never claims a ranking the plan data doesn't hold
const rules = computed(() => [...Map.groupBy(trip.planRun?.exclusions ?? [], exclusion => exclusion.factId).values()]
  .map(([first, ...rest]) => ({
    id: first!.factId,
    value: first!.factValue,
    domain: first!.factDomain,
    subjectName: first!.subjectName,
    names: [...new Set([first!, ...rest].map(exclusion => exclusion.name))]
  })))

const preferences = computed(() => {
  const cited = trip.days.flatMap(day => day.items.flatMap(item => item.citedFacts
    .filter(fact => fact.kind === EPreferenceKind.PREFERENCE)
    .map(fact => ({ fact, name: item.name }))))

  return [...Map.groupBy(cited, ({ fact }) => fact.id).values()].map(group => ({
    ...group[0]!.fact,
    names: [...new Set(group.map(({ name }) => name))]
  }))
})

// Facts code can't check sit with their own kind; a preference an item already cites is listed above, not twice
const unverifiedRules = computed(() => trip.unverifiedFacts.filter(fact => fact.kind === EPreferenceKind.HARD_CONSTRAINT))
const unverifiedPreferences = computed(() => {
  const cited = new Set(preferences.value.map(preference => preference.id))

  return trip.unverifiedFacts.filter(fact => fact.kind === EPreferenceKind.PREFERENCE && !cited.has(fact.id))
})
</script>

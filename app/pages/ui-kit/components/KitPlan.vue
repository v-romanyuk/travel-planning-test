<template>
  <KitSection title="Plan">
    <template #description>
      <code>PlanDay</code> draws the trail, <code>PlanTrailItem</code> places the marker,
      <code>PlanItemCard</code> shows one grounded item. Every price, time and place comes with its catalogue
      source; a gap is shown with <code>MissingFact</code>, never filled in.
    </template>

    <div class="flex flex-wrap gap-4 text-sm">
      <span v-for="marker in markers" :key="marker.kind" class="inline-flex items-center gap-2">
        <PlanItemMarker :kind="marker.kind" />
        {{ marker.label }}
      </span>
    </div>

    <NothingBookedNotice />

    <PlanDay label="Day 3" date="Sat 14 Nov" title="Sintra">
      <template #actions>
        <UButton variant="outline" color="neutral" icon="icon:pencil">
          Edit day
        </UButton>
      </template>

      <PlanTrailItem v-for="item in items" :key="item.id" :kind="item.kind">
        <PlanItemCard :item="item" :timeLabel="timeLabels[item.id]" />
      </PlanTrailItem>

      <template #after>
        <PlanDayNote class="ml-10">
          Wear good shoes, Sintra is steep.
        </PlanDayNote>
      </template>
    </PlanDay>

    <div class="pl-10">
      <PlanItemCard :item="items[1]!">
        <template #actions>
          <UButton variant="outline" color="error" icon="icon:trash-2">
            Remove from plan
          </UButton>
        </template>
      </PlanItemCard>
    </div>
  </KitSection>
</template>

<script lang="ts" setup>
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'

const markers = [
  { kind: EItemKind.STAY, label: 'Stay' },
  { kind: EItemKind.PLACE, label: 'Place' },
  { kind: EItemKind.TRANSPORT, label: 'Transport' }
]

const planned = { status: 'planned' as const, endTime: null, transport: null, citedFacts: [], note: null }

const items: TTripItemRes[] = [
  {
    ...planned,
    id: 't2',
    position: 0,
    kind: EItemKind.TRANSPORT,
    name: 'Train',
    time: '09:11',
    endTime: '09:51',
    transport: { from: 'Lisbon', to: 'Sintra', departs: '09:11', arrives: '09:51', arrivesNextDay: false },
    why: 'No stored preference applied. Arrives in time for the 10:30 palace entry.',
    price: { amount: 2.4, currency: 'EUR', unit: 'per_person' },
    source: 'transport/tr-0031'
  },
  {
    ...planned,
    id: 'g',
    position: 1,
    kind: EItemKind.PLACE,
    name: 'Palácio da Pena',
    time: '10:30',
    why: 'No stored preference applied. Earliest timed entry listed in the catalogue.',
    price: { amount: 20, currency: 'EUR', unit: 'per_adult' },
    source: 'places/lis-410'
  },
  {
    ...planned,
    id: 'i',
    position: 2,
    kind: EItemKind.PLACE,
    name: 'Raiz Vegetarian Kitchen, Sintra',
    time: '13:00',
    why: 'Vegetarian restaurant near Sintra station.',
    price: null,
    source: 'places/lis-433',
    note: 'Book a table for four.'
  },
  {
    ...planned,
    id: 'a',
    position: 3,
    kind: EItemKind.STAY,
    name: 'Casa do Largo, Graça',
    time: '15:00',
    why: 'Quiet, walkable neighbourhood.',
    price: { amount: 142, currency: 'EUR', unit: 'per_night' },
    source: 'stays/lis-014'
  }
]

const timeLabels: Record<string, string> = { t2: 'Departs', a: 'Check-in' }
</script>

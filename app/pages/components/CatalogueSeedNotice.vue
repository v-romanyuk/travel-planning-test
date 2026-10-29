<template>
  <UAlert
    v-if="status?.seedEnabled"
    :color="status.entries === 0 ? 'warning' : 'neutral'"
    variant="soft"
    icon="icon:map"
    :title="status.entries === 0 ? 'The catalogue is empty' : `Catalogue: ${status.entries.toLocaleString('en-GB')} entries`"
    :description="status.entries === 0
      ? 'The planner can only use catalogue entries, so every request fails until it is seeded.'
      : 'Seeding again updates the fixture entries and keeps everything else.'"
    :actions="[{ label: 'Seed catalogue', color: 'primary', loading: seeding, onClick: confirmSeed }]"
  />
</template>

<script lang="ts" setup>
const { status, seeding, confirmSeed } = useCatalogueSeed()
</script>

<template>
  <KitSection title="Type">
    <template #description>
      Bricolage Grotesque (<code>font-display</code>) for titles, times and names. Hanken Grotesk
      (<code>font-sans</code>) for everything else.
    </template>

    <div class="flex flex-col divide-y divide-default rounded-2xl bg-default border border-default">
      <div v-for="sample in samples" :key="sample.token" class="flex flex-wrap items-baseline gap-x-6 gap-y-1 px-5 py-4">
        <code class="w-44 shrink-0 text-xs text-muted">{{ sample.token }}</code>
        <span :class="sample.class">{{ sample.text }}</span>
      </div>
    </div>
  </KitSection>
</template>

<script lang="ts" setup>
const samples = [
  { token: 'display / 64 bold', class: 'font-display font-bold text-6xl tracking-tight leading-none text-highlighted', text: 'Lisbon' },
  { token: 'display / 44 bold', class: 'font-display font-bold text-[44px] tracking-tight leading-tight text-highlighted', text: 'Where are you going?' },
  { token: 'display / 32 bold', class: 'font-display font-bold text-3xl tracking-tight text-highlighted', text: 'Day 1' },
  { token: 'display / 20 semibold', class: 'font-display font-semibold text-xl text-highlighted', text: 'Casa do Largo, Graça' },
  { token: 'display / 22 tabular', class: 'font-display font-bold text-[22px] tabular-nums text-highlighted', text: '08:05' },
  { token: 'sans / 16 regular', class: 'text-base', text: 'Quiet residential street a short walk from the 28 tram.' },
  { token: 'sans / 13 muted', class: 'text-[13px] text-muted', text: 'Source: catalogue entry stays/lis-014' }
]
</script>

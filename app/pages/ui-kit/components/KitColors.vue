<template>
  <KitSection title="Colour">
    <template #description>
      Forest is the trail and every primary action. Moss is the neutral ground. Ember is reserved for hard rules,
      so a rule never looks like a preference.
    </template>

    <div v-for="palette in palettes" :key="palette.name" class="flex flex-col gap-2">
      <div class="flex items-baseline gap-2">
        <span class="font-semibold text-highlighted">{{ palette.name }}</span>
        <span class="text-sm text-muted">{{ palette.role }}</span>
      </div>
      <div class="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
        <div v-for="shade in shades" :key="shade" class="flex flex-col gap-1">
          <div
            class="h-12 rounded-lg border border-black/5"
            :style="{ background: `var(--color-${palette.token}-${shade})` }"
          />
          <span class="text-xs text-muted tabular-nums">{{ shade }}</span>
        </div>
      </div>
    </div>

    <div class="grid sm:grid-cols-3 gap-3 text-sm">
      <div
        v-for="token in semantic"
        :key="token.name"
        class="flex items-center gap-3 p-3 rounded-xl bg-default border border-default"
      >
        <span class="size-8 shrink-0 rounded-lg border border-black/5" :class="token.swatch" />
        <div>
          <code class="font-semibold text-highlighted">{{ token.name }}</code>
          <div class="text-muted">
            {{ token.use }}
          </div>
        </div>
      </div>
    </div>
  </KitSection>
</template>

<script lang="ts" setup>
const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

const palettes = [
  { name: 'Forest', token: 'forest', role: 'primary · success' },
  { name: 'Moss', token: 'moss', role: 'neutral' },
  { name: 'Ember', token: 'ember', role: 'rule (hard constraints)' }
]

const semantic = [
  { name: 'bg-muted', use: 'Page ground', swatch: 'bg-muted' },
  { name: 'bg-default', use: 'Cards, inputs', swatch: 'bg-default' },
  { name: 'bg-primary', use: 'Primary actions, stays', swatch: 'bg-primary' },
  { name: 'text-highlighted', use: 'Headings, key text', swatch: 'bg-(--ui-text-highlighted)' },
  { name: 'text-muted', use: 'Secondary text (4.5:1)', swatch: 'bg-(--ui-text-muted)' },
  { name: 'color="rule"', use: 'Hard constraints', swatch: 'bg-rule' }
]
</script>

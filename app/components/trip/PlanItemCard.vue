<template>
  <article
    class="grid grid-cols-[64px_minmax(0,1fr)] sm:grid-cols-[76px_minmax(0,1fr)] gap-x-4 gap-y-1
      px-4.5 py-4 rounded-2xl bg-default border border-muted"
  >
    <div class="row-span-3">
      <div class="font-display font-bold text-[22px] leading-tight tabular-nums text-highlighted">
        {{ item.time }}
      </div>
      <div class="text-[13px] text-muted">
        {{ timeLabel }}
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2 min-w-0">
      <h3 class="font-display font-semibold text-xl leading-snug text-highlighted break-words min-w-0">
        {{ item.name }}
      </h3>
      <div class="flex items-center gap-1.5">
        <span class="text-[13px] text-muted">{{ ITEM_KIND_LABELS[item.kind] }}</span>
        <UBadge color="primary" variant="soft">
          Planned
        </UBadge>
      </div>
    </div>

    <div v-if="item.transport" class="flex flex-wrap items-center gap-x-2 font-semibold text-[15px]">
      <span>{{ item.transport.from }}</span>
      <Icon name="move-right" class="size-5 text-muted" />
      <span>{{ item.transport.to }}</span>
      <span class="font-normal text-muted">
        arrives {{ item.transport.arrives }}<template v-if="item.transport.arrivesNextDay"> (+1 day)</template>
      </span>
    </div>

    <p v-if="formatWhy(item.why)" class="text-[15px] text-toned break-words" :class="{ 'col-start-2': item.transport }">
      {{ formatWhy(item.why) }}
    </p>

    <div class="col-start-2 flex flex-wrap items-center justify-between gap-2 mt-1 text-[13px] text-muted">
      <strong v-if="item.price" class="font-semibold text-highlighted">{{ formatPrice(item.price) }}</strong>
      <MissingFact v-else>
        Price not in catalogue
      </MissingFact>
      <span class="break-all">Source: catalogue entry {{ item.source }}</span>
    </div>

    <div v-if="$slots.default" class="col-start-2 mt-2">
      <slot />
    </div>

    <div v-if="$slots.actions" class="col-start-2 mt-2">
      <slot name="actions" />
    </div>
  </article>
</template>

<script lang="ts" setup>
defineProps<{
  item: TTripItemRes
  // "Departs", "Check-in", "Check-out" — empty when the time needs no label
  timeLabel?: string
}>()
</script>

<template>
  <div class="flex gap-2.5 px-4 py-3.5 rounded-2xl bg-elevated border border-default">
    <Icon name="sticky-note" class="size-4.5 shrink-0 mt-1 text-muted" />
    <div>
      <div class="text-[13px] font-semibold text-muted">
        Your note
      </div>
      <div class="whitespace-pre-line text-highlighted">
        <slot />
      </div>
    </div>
  </div>
</template>

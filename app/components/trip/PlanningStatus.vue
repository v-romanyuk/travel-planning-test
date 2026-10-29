<template>
  <div role="status" class="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-default border border-default">
    <span aria-hidden="true" class="size-2.5 shrink-0 rounded-full bg-primary motion-safe:animate-pulse" />
    <span>
      <slot>Planning in the background. You can close this page.</slot>
    </span>
  </div>
</template>

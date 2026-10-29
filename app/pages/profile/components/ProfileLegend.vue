<template>
  <ul aria-label="Legend" class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
    <li class="flex items-center gap-2">
      <span aria-hidden="true" class="w-8 border-t-3 border-ember-500" />
      <span><strong class="text-highlighted">Hard rule</strong> (solid line) removes options</span>
    </li>
    <li class="flex items-center gap-2">
      <span aria-hidden="true" class="w-8 border-t-3 border-dashed border-primary-500" />
      <span><strong class="text-highlighted">Preference</strong> (dashed line) ranks options</span>
    </li>
  </ul>
</template>

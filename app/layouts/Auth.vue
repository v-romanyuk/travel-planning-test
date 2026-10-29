<template>
  <div class="min-h-full flex flex-col items-center justify-center gap-8 px-5 py-12 bg-muted">
    <AppLogo />

    <main class="w-full max-w-md p-8 rounded-2xl bg-default border border-default">
      <slot />
    </main>
  </div>
</template>

<script lang="ts" setup>
useHead({
  titleTemplate: title => title ? `${title} | Trip Planner` : 'Trip Planner'
})
</script>

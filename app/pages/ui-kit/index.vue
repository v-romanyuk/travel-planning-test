<template>
  <div class="flex flex-col gap-14">
    <div class="max-w-[65ch]">
      <h1 class="font-display font-bold text-[44px] leading-tight tracking-tight text-highlighted">
        UI kit
      </h1>
      <p class="text-muted">
        Tokens and components for the trip planner. Theme lives in <code>app/assets/styles/main.css</code> and
        <code>app/app.config.ts</code>; trip components in <code>app/components/</code>.
      </p>
    </div>

    <KitColors />
    <KitTypography />
    <KitControls />
    <KitPlan />
    <KitProfile />
    <KitChat />
  </div>
</template>

<script lang="ts" setup>
useHead({ title: 'UI kit' })
</script>

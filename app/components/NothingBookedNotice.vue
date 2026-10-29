<template>
  <p class="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-default border border-default text-[15px]">
    <Icon name="shield-check" class="size-5 shrink-0 text-primary" />
    <span>
      <slot>Nothing in this plan is booked or paid. Every item is a suggestion you can change.</slot>
    </span>
  </p>
</template>

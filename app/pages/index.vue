<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-display font-bold text-[44px] leading-tight tracking-tight text-highlighted">
          Plan a trip
        </h1>
        <p class="text-muted">
          The planner works in the background, from your profile and the catalogue. It never books or pays for anything.
        </p>
      </div>
      <UButton :to="{ name: 'trips' }" icon="icon:map" color="neutral" variant="outline">
        Your trips
      </UButton>
    </div>

    <CatalogueSeedNotice />

    <div class="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] rounded-[28px] overflow-hidden bg-default border border-default">
      <div class="flex flex-col gap-3 p-6 sm:p-8 lg:p-10 bg-primary">
        <h2 class="font-display font-bold text-3xl sm:text-4xl leading-tight tracking-tight text-inverted">
          Where are you going?
        </h2>
        <p class="max-w-[40ch] text-primary-100">
          Tell the planner the basics, then close this page. You get one WhatsApp message when the plan is ready.
        </p>

        <!-- Decorative: the trail from home to a destination, past a transport, a stay and a place.
             Out of flow, so the form alone sets the card's height -->
        <div class="relative hidden lg:block grow min-h-64 mt-4">
          <img
            src="/images/trip-trail.svg"
            alt=""
            class="absolute inset-0 size-full object-contain object-bottom"
          >
        </div>
      </div>

      <TripRequestForm class="p-6 sm:p-8 lg:p-10" />
    </div>
  </div>
</template>

<script lang="ts" setup>
useHead({ title: 'Plan a trip' })
</script>

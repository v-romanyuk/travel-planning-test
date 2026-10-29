<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-col gap-4 max-w-[60ch]">
      <div>
        <h1 class="font-display font-bold text-[44px] leading-tight tracking-tight text-highlighted">
          Your travel profile
        </h1>
        <p class="text-muted">
          The planner reads only what's stored here. It never adds a rule or preference on its own.
        </p>
      </div>
      <ProfileLegend />
    </div>

    <div v-if="loading" role="status" aria-label="Loading your profile" class="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
      <USkeleton class="h-96 rounded-2xl" />
      <USkeleton class="h-64 rounded-2xl" />
    </div>

    <UEmpty
      v-else-if="loadError"
      icon="icon:circle-help"
      title="Your profile couldn't be loaded"
      :description="loadError"
      variant="outline"
      class="bg-default rounded-2xl"
      :actions="[{ label: 'Try again', onClick: load }]"
    />

    <div v-else class="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
      <ProfileGraph />

      <div class="flex flex-col gap-6 min-w-0">
        <HomeCityCard />
        <FactForm />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
useHead({ title: 'Profile' })

const profileStore = useProfileStore()
const { loading, loadError, load } = useProfileGraph()

// The store outlives the page; a visit starts from storage, not from a half-typed fact
onMounted(() => {
  profileStore.reset()
  load()
})
</script>

<template>
  <section
    aria-labelledby="profile-graph-title"
    class="flex flex-col gap-6 p-4 sm:p-6 rounded-2xl bg-default border border-default"
  >
    <h2 id="profile-graph-title" class="font-display font-bold text-xl text-highlighted">
      Who travels and what matters to them
    </h2>

    <ul class="flex flex-col gap-6">
      <ProfileRow
        v-for="row in rows"
        :key="row.id"
        :row="row"
        @removeFact="confirmRemoveFact"
        @removePerson="confirmRemoveCompanion(row)"
      />
    </ul>

    <AddCompanionForm class="pt-4 border-t border-default" />
  </section>
</template>

<script lang="ts" setup>
const { rows } = storeToRefs(useProfileStore())
const { confirmRemoveFact, confirmRemoveCompanion } = useProfileRemovals()
</script>

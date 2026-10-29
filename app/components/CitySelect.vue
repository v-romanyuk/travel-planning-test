<template>
  <USelectMenu
    v-model="model"
    v-model:search-term="searchTerm"
    :items="items"
    by="id"
    ignore-filter
    :icon="icon"
    placeholder="Search for a city"
    :search-input="{ placeholder: 'Type at least 2 letters', loading }"
    size="xl"
    class="w-full"
  >
    <template #empty>
      {{ emptyText }}
    </template>
  </USelectMenu>
</template>

<script lang="ts" setup>
import type { TCity } from '~~/shared/schemas/cities/CitySchema'

const model = defineModel<TCity | undefined>()

const { icon = 'icon:house' } = defineProps<{
  icon?: string
}>()

const toast = useToast()

const searchTerm = ref('')
const searchTermDebounced = refDebounced(searchTerm, 250)
const results = ref<TCity[]>([])
const loading = ref(false)

// Keep the selected city listed so the menu can still show it after the results change
const items = computed(() => model.value && !results.value.some(city => city.id === model.value!.id)
  ? [model.value, ...results.value]
  : results.value)

const emptyText = computed(() => searchTerm.value.trim().length < 2 ? 'Type at least 2 letters' : 'No cities found')

watch(searchTermDebounced, async (term) => {
  const query = term.trim()
  if (query.length < 2) {
    results.value = []

    return
  }

  loading.value = true
  try {
    const cities = await citiesService.search(query)
    // A slower, older request must not overwrite results for what the user typed since
    if (query === searchTermDebounced.value.trim()) results.value = cities
  } catch {
    toast.add({ title: 'City search is unavailable', description: 'Try again in a moment.', color: 'error' })
  } finally {
    loading.value = false
  }
})
</script>

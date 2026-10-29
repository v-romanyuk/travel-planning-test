import type { TCity } from '~~/shared/schemas/cities/CitySchema'

/** The home city picker: saved on the user, so new trips start from it; existing trips keep their origin. */
export function useHomeCityForm () {
  const authStore = useAuthStore()
  const toast = useToast()

  const picked = ref<TCity | undefined>(authStore.user?.homeCity)
  const saving = ref(false)
  const saved = ref(false)

  const changed = computed(() => Boolean(picked.value && picked.value.id !== authStore.user?.homeCity.id))

  watch(() => authStore.user?.homeCity, (homeCity) => {
    picked.value ??= homeCity
  })
  watch(picked, () => {
    if (changed.value) saved.value = false
  })

  async function save () {
    if (!picked.value || !changed.value || saving.value) return

    saving.value = true
    try {
      await authStore.updateHomeCity(picked.value)
      saved.value = true
    } catch (error) {
      toast.add({ title: 'Couldn\'t save your home city', description: getErrorMessage(error), color: 'error' })
    } finally {
      saving.value = false
    }
  }

  return { picked, saving, saved, changed, save }
}

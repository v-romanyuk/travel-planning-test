import type { TCatalogueStatusRes } from '~~/shared/schemas/catalogue/CatalogueStatusResSchema'

/** The "Seed catalogue" control: shown only when the server allows seeding (NUXT_CATALOGUE_SEED_ENABLED). */
export function useCatalogueSeed () {
  const toast = useToast()
  const { openModal } = useModals()

  const status = ref<TCatalogueStatusRes | null>(null)
  const seeding = ref(false)

  async function load () {
    try {
      status.value = await catalogueService.getStatus()
    } catch (error) {
      // Not worth blocking the form over; the request itself reports a missing catalogue
      console.warn('[catalogue] status unavailable', getErrorMessage(error))
    }
  }

  async function seed () {
    seeding.value = true
    try {
      status.value = await catalogueService.seed()
      toast.add({
        title: 'Catalogue seeded',
        description: `${status.value.entries.toLocaleString('en-GB')} stays, places and transport legs are ready to plan with.`,
        color: 'success'
      })
    } catch (error) {
      toast.add({ title: 'Couldn\'t seed the catalogue', description: getErrorMessage(error), color: 'error' })
    } finally {
      seeding.value = false
    }
  }

  function confirmSeed () {
    openModal('AppConfirmModal', {
      title: 'Seed the catalogue?',
      description: 'Writes the 10,000-entry fixture catalogue. Entries with the same reference are updated; nothing is deleted, so existing plans keep their sources.',
      confirmLabel: 'Seed catalogue',
      confirmColor: 'primary',
      onConfirm: seed
    })
  }

  onMounted(() => {
    load()
  })

  return { status, seeding, confirmSeed }
}

import { repos } from '~~/server/repos'

export const getCatalogueStatus = async () => ({
  entries: await repos.catalogueEntriesRepo.countCatalogueEntries(),
  seedEnabled: useRuntimeConfig().catalogueSeedEnabled
})

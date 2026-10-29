class CatalogueService {
  getStatus () {
    return $fetch('/api/catalogue')
  }

  seed () {
    return $fetch('/api/catalogue/seed', { method: 'POST' })
  }
}

export const catalogueService = new CatalogueService()

class CitiesService {
  search (query: string) {
    return $fetch('/api/cities', { query: { query } })
  }
}

export const citiesService = new CitiesService()

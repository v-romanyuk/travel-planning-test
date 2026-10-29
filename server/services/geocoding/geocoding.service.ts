import type { TCity } from '~~/shared/schemas/cities/CitySchema'
import { createUserError } from '~~/server/utils/errorUtils'

// Open-Meteo Geocoding (GeoNames data): free, no API key. https://open-meteo.com/en/docs/geocoding-api
const BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search'

interface IOpenMeteoPlace {
  id: number
  name: string
  latitude: number
  longitude: number
  feature_code?: string
  country_code?: string
  country?: string
  admin1?: string
}

interface ISearchCitiesInput {
  query: string
  limit: number
}

const toLabel = (place: IOpenMeteoPlace) => [place.name, place.admin1 === place.name ? undefined : place.admin1, place.country]
  .filter(Boolean)
  .join(', ')

export const geocodingService = () => ({
  async searchCities ({ query, limit }: ISearchCitiesInput): Promise<TCity[]> {
    const response = await $fetch<{ results?: IOpenMeteoPlace[] }>(BASE_URL, {
      query: { name: query, count: limit, language: 'en', format: 'json' },
      timeout: 5000
    }).catch((error: unknown) => {
      console.error('[geocoding] search failed', error instanceof Error ? error.message : error)
      throw createUserError({ statusCode: 502, message: 'City search is unavailable right now. Try again in a moment.' })
    })

    // PPL* = populated places (cities, towns); skips regions, islands and other features with the same name
    return (response.results ?? [])
      .filter(place => place.feature_code?.startsWith('PPL') && place.country && place.country_code)
      .map(place => ({
        id: place.id,
        name: place.name,
        region: place.admin1 ?? null,
        country: place.country!,
        countryCode: place.country_code!,
        latitude: place.latitude,
        longitude: place.longitude,
        label: toLabel(place)
      }))
  }
})

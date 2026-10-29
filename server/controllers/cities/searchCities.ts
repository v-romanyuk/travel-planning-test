import { geocodingService } from '~~/server/services/geocoding/geocoding.service'
import type { TSearchCitiesReq } from '~~/shared/schemas/cities/SearchCitiesReqSchema'

export const searchCities = ({ query }: TSearchCitiesReq) => geocodingService().searchCities({ query, limit: 8 })

import { searchCities } from '~~/server/controllers/cities/searchCities'
import { CitiesResSchema } from '~~/shared/schemas/cities/CitiesResSchema'
import { SearchCitiesReqSchema } from '~~/shared/schemas/cities/SearchCitiesReqSchema'

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, q => SearchCitiesReqSchema.parse(q))
  const cities = await searchCities(query)

  return CitiesResSchema.parse(cities)
})

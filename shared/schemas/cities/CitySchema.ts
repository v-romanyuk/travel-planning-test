import { z } from 'zod'

// A GeoNames place as returned by the geocoding service; stored as-is on the user (home city) and later on trips
export const CitySchema = z.object({
  id: z.int(),
  name: z.string(),
  region: z.string().nullable(),
  country: z.string(),
  countryCode: z.string().length(2),
  latitude: z.number(),
  longitude: z.number(),
  label: z.string()
})

export type TCity = z.infer<typeof CitySchema>

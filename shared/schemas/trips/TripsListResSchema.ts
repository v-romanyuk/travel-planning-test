import { z } from 'zod'

import { CitySchema } from '~~/shared/schemas/cities/CitySchema'
import { ETripStatus } from '~~/shared/schemas/trips/TripStatus'

export const TripsListResSchema = z.array(z.object({
  id: z.uuid(),
  destination: CitySchema,
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  status: z.enum(ETripStatus),
  createdAt: z.date().transform(d => d.toISOString())
}))

export type TTripsListRes = z.infer<typeof TripsListResSchema>

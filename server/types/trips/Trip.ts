import { z } from 'zod'

import { CitySchema } from '~~/shared/schemas/cities/CitySchema'
import { ETripStatus } from '~~/shared/schemas/trips/TripStatus'

export const TripSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  origin: CitySchema,
  destination: CitySchema,
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  notes: z.string().nullable(),
  timeZone: z.string(),
  status: z.enum(ETripStatus),
  failureReason: z.string().nullable(),
  whatsappNumber: z.string().nullable(),
  whatsappOptIn: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type TTrip = z.infer<typeof TripSchema>

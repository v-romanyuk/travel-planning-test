import { z } from 'zod'

export const TripDaySchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  position: z.int(),
  date: z.iso.date(),
  title: z.string().nullable(),
  note: z.string().nullable(),
  titleSetByTraveller: z.boolean()
})

export type TTripDay = z.infer<typeof TripDaySchema>

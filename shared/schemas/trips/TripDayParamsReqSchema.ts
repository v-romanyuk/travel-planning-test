import { z } from 'zod'

export const TripDayParamsReqSchema = z.object({
  tripId: z.uuid('This trip link isn\'t valid.'),
  dayId: z.uuid('This day link isn\'t valid.')
})

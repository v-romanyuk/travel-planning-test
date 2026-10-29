import { z } from 'zod'

export const TripParamsReqSchema = z.object({
  tripId: z.uuid('This trip link isn\'t valid.')
})

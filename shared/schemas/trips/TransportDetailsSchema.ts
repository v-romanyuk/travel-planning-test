import { z } from 'zod'

// City names, copied from the catalogue entry when the plan is written
export const TransportDetailsSchema = z.object({
  from: z.string(),
  to: z.string(),
  departs: z.string(),
  arrives: z.string(),
  arrivesNextDay: z.boolean()
})

export type TTransportDetails = z.infer<typeof TransportDetailsSchema>

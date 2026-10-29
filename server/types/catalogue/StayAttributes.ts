import { z } from 'zod'

import { ClockTimeSchema } from '~~/shared/schemas/catalogue/ClockTimeSchema'

export const StayAttributesSchema = z.object({
  area: z.string(),
  tags: z.array(z.string()),
  checkIn: ClockTimeSchema,
  checkOut: ClockTimeSchema
})

export type TStayAttributes = z.infer<typeof StayAttributesSchema>

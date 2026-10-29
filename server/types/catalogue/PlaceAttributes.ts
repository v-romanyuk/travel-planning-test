import { z } from 'zod'

import { ClockTimeSchema } from '~~/shared/schemas/catalogue/ClockTimeSchema'
import { EPlaceCategory } from '~~/shared/schemas/catalogue/PlaceCategory'

export const PlaceAttributesSchema = z.object({
  category: z.enum(EPlaceCategory),
  opensAt: ClockTimeSchema.nullable(),
  closesAt: ClockTimeSchema.nullable(),
  durationMin: z.int().positive().nullable(),
  dietaryTags: z.array(z.string()),
  tags: z.array(z.string())
})

export type TPlaceAttributes = z.infer<typeof PlaceAttributesSchema>

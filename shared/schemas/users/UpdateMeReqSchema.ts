import { z } from 'zod'

import { CitySchema } from '~~/shared/schemas/cities/CitySchema'

export const UpdateMeReqSchema = z.object({
  homeCity: z.object(CitySchema.shape, { error: 'Choose your home city' })
})

export type TUpdateMeReq = z.infer<typeof UpdateMeReqSchema>

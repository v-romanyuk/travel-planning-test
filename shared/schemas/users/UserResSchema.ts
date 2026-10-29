import { z } from 'zod'

import { CitySchema } from '~~/shared/schemas/cities/CitySchema'

export const UserResSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  fullName: z.string(),
  homeCity: CitySchema,
  createdAt: z.date().transform(d => d.toISOString())
})

export type TUserRes = z.infer<typeof UserResSchema>

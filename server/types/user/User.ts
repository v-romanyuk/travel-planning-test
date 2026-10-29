import { z } from 'zod'

import { CitySchema } from '~~/shared/schemas/cities/CitySchema'

export const UserSchema = z.object({
  id: z.uuid(),
  subId: z.uuid(),
  email: z.email(),
  fullName: z.string(),
  homeCity: CitySchema,
  createdAt: z.date()
})

export type TUser = z.infer<typeof UserSchema>

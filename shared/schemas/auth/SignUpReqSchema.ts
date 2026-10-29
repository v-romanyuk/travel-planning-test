import { z } from 'zod'

import { CitySchema } from '~~/shared/schemas/cities/CitySchema'

export const SignUpReqSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your full name').max(200),
  email: z.email('Enter a valid email').trim().toLowerCase(),
  password: z.string().min(8, 'Use at least 8 characters').max(72),
  homeCity: z.object(CitySchema.shape, { error: 'Choose your home city' })
})

export type TSignUpReq = z.infer<typeof SignUpReqSchema>

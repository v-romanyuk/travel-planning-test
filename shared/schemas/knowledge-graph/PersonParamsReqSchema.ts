import { z } from 'zod'

export const PersonParamsReqSchema = z.object({
  personId: z.uuid()
})

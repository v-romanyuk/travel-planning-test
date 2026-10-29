import { z } from 'zod'

export const FactParamsReqSchema = z.object({
  factId: z.uuid()
})

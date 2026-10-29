import { z } from 'zod'

export const CreatePersonReqSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(100, 'Keep the name under 100 characters')
})

export type TCreatePersonReq = z.infer<typeof CreatePersonReqSchema>

import { z } from 'zod'

import { EPersonRole } from '~~/shared/schemas/knowledge-graph/PersonRole'

export const PersonSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  role: z.enum(EPersonRole),
  name: z.string().nullable(),
  createdAt: z.date()
})

export type TPerson = z.infer<typeof PersonSchema>

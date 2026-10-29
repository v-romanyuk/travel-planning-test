import { z } from 'zod'

import { EPersonRole } from '~~/shared/schemas/knowledge-graph/PersonRole'

export const PersonResSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  role: z.enum(EPersonRole)
})

export type TPersonRes = z.infer<typeof PersonResSchema>

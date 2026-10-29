import { z } from 'zod'

export const CatalogueStatusResSchema = z.object({
  entries: z.int(),
  seedEnabled: z.boolean()
})

export type TCatalogueStatusRes = z.infer<typeof CatalogueStatusResSchema>

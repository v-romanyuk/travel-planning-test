import { z } from 'zod'

export const SearchCitiesReqSchema = z.object({
  query: z.string().trim().min(2).max(100)
})

export type TSearchCitiesReq = z.infer<typeof SearchCitiesReqSchema>

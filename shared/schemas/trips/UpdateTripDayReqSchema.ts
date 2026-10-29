import { z } from 'zod'

// Only what changed is sent: an omitted title or note stays as it is
export const UpdateTripDayReqSchema = z.object({
  // null or '' leaves the day untitled and lets the planner title it again
  title: z.string().trim().max(200, 'Day title: at most 200 characters').nullable()
    .optional(),
  note: z.string().trim().max(1000, 'Note: at most 1000 characters').nullable()
    .optional(),
  removedItemIds: z.array(z.uuid()).default([]),
  itemNotes: z.array(z.object({
    itemId: z.uuid(),
    note: z.string().trim().max(500, 'Item note: at most 500 characters').nullable()
  })).default([])
})

export type TUpdateTripDayReq = z.infer<typeof UpdateTripDayReqSchema>

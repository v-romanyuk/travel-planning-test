import { z } from 'zod'

import { RunExclusionSchema } from '~~/shared/schemas/trips/RunExclusionSchema'
import { SavedPlanSchema } from '~~/server/types/trips/SavedPlan'
import { UnverifiedFactSchema } from '~~/shared/schemas/trips/UnverifiedFactSchema'
import { ERunStatus } from '~~/shared/schemas/trips/RunStatus'
import { ENotificationStatus } from '~~/server/types/trips/NotificationStatus'

export const TripRunSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  status: z.enum(ERunStatus),
  failureReason: z.string().nullable(),
  draftPlan: SavedPlanSchema.nullable(),
  rejections: z.int(),
  exclusions: z.array(RunExclusionSchema),
  unverifiedFacts: z.array(UnverifiedFactSchema),
  startedAt: z.date().nullable(),
  finishedAt: z.date().nullable(),
  notificationStatus: z.enum(ENotificationStatus).nullable(),
  notificationRef: z.string().nullable(),
  notifiedAt: z.date().nullable(),
  createdAt: z.date()
})

export type TTripRun = z.infer<typeof TripRunSchema>

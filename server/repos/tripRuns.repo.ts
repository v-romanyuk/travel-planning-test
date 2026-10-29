import { and, asc, desc, eq, inArray, lt, sql } from 'drizzle-orm'

import { tripRunsTable } from '~~/server/services/drizzle/schema'
import type { ITripRunsRepo } from '~~/server/types/repos/ITripRunsRepo'
import { TripRunSchema } from '~~/server/types/trips/TripRun'
import { firstOrThrow } from '~~/server/utils/dbUtils'
import type { TDrizzle } from '~~/server/utils/drizzle'
import { ERunStatus } from '~~/shared/schemas/trips/RunStatus'
import { ENotificationStatus } from '~~/server/types/trips/NotificationStatus'

export const tripRunsRepo = (db: TDrizzle): ITripRunsRepo => ({
  async insertTripRun (tripId) {
    const rows = await db.insert(tripRunsTable).values({ tripId, status: ERunStatus.QUEUED }).returning()

    return TripRunSchema.parse(firstOrThrow(rows, 'insertTripRun'))
  },

  async findTripRunById (runId) {
    const [row] = await db.select().from(tripRunsTable).where(eq(tripRunsTable.id, runId)).limit(1)

    return row ? TripRunSchema.parse(row) : undefined
  },

  async findTripRunsByTripId (tripId) {
    const rows = await db
      .select()
      .from(tripRunsTable)
      .where(eq(tripRunsTable.tripId, tripId))
      .orderBy(desc(tripRunsTable.createdAt))

    return TripRunSchema.array().parse(rows)
  },

  async findTripRunsByStatuses (statuses) {
    const rows = await db.select().from(tripRunsTable).where(inArray(tripRunsTable.status, statuses))

    return TripRunSchema.array().parse(rows)
  },

  async markTripRunRunning (runId, unverifiedFacts) {
    const [row] = await db
      .update(tripRunsTable)
      .set({ status: ERunStatus.RUNNING, startedAt: sql`now()`, unverifiedFacts })
      .where(and(eq(tripRunsTable.id, runId), eq(tripRunsTable.status, ERunStatus.QUEUED)))
      .returning()

    return row ? TripRunSchema.parse(row) : undefined
  },

  async updateTripRunExclusions (runId, exclusions) {
    await db.update(tripRunsTable).set({ exclusions }).where(eq(tripRunsTable.id, runId))
  },

  async updateTripRunDraftPlan (runId, draftPlan) {
    await db.update(tripRunsTable).set({ draftPlan }).where(eq(tripRunsTable.id, runId))
  },

  async incrementTripRunRejections (runId) {
    const [row] = await db
      .update(tripRunsTable)
      .set({ rejections: sql`${tripRunsTable.rejections} + 1` })
      .where(eq(tripRunsTable.id, runId))
      .returning({ rejections: tripRunsTable.rejections })

    return row?.rejections ?? 0
  },

  async finishTripRun (runId, status, failureReason, notificationStatus) {
    const [row] = await db
      .update(tripRunsTable)
      .set({ status, failureReason, notificationStatus, finishedAt: sql`now()` })
      .where(and(
        eq(tripRunsTable.id, runId),
        inArray(tripRunsTable.status, [ERunStatus.QUEUED, ERunStatus.RUNNING])
      ))
      .returning()

    return row ? TripRunSchema.parse(row) : undefined
  },

  async settleTripRunNotification (runId, status, ref) {
    const [row] = await db
      .update(tripRunsTable)
      .set({
        notificationStatus: status,
        notificationRef: ref,
        notifiedAt: status === ENotificationStatus.SKIPPED ? null : sql`now()`
      })
      .where(and(eq(tripRunsTable.id, runId), eq(tripRunsTable.notificationStatus, ENotificationStatus.PENDING)))
      .returning()

    return row ? TripRunSchema.parse(row) : undefined
  },

  async findPendingNotificationTripRuns (finishedBefore) {
    const rows = await db
      .select()
      .from(tripRunsTable)
      .where(and(
        eq(tripRunsTable.notificationStatus, ENotificationStatus.PENDING),
        lt(tripRunsTable.finishedAt, finishedBefore)
      ))
      .orderBy(asc(tripRunsTable.finishedAt))

    return TripRunSchema.array().parse(rows)
  },

  async expirePendingNotifications (finishedBefore) {
    const rows = await db
      .update(tripRunsTable)
      .set({ notificationStatus: ENotificationStatus.FAILED, notificationRef: 'expired', notifiedAt: sql`now()` })
      .where(and(
        eq(tripRunsTable.notificationStatus, ENotificationStatus.PENDING),
        lt(tripRunsTable.finishedAt, finishedBefore)
      ))
      .returning({ id: tripRunsTable.id })

    return rows.length
  }
})

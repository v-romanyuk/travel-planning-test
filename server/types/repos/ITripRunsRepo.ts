import type { TRunExclusion } from '~~/shared/schemas/trips/RunExclusionSchema'
import type { TSavedPlan } from '~~/server/types/trips/SavedPlan'
import type { TTripRun } from '~~/server/types/trips/TripRun'
import type { TUnverifiedFact } from '~~/shared/schemas/trips/UnverifiedFactSchema'
import type { ERunStatus } from '~~/shared/schemas/trips/RunStatus'
import type { ENotificationStatus } from '~~/server/types/trips/NotificationStatus'

export interface ITripRunsRepo {
  insertTripRun: (tripId: string) => Promise<TTripRun>
  findTripRunById: (runId: string) => Promise<TTripRun | undefined>
  // Newest first
  findTripRunsByTripId: (tripId: string) => Promise<TTripRun[]>
  findTripRunsByStatuses: (statuses: ERunStatus[]) => Promise<TTripRun[]>
  markTripRunRunning: (runId: string, unverifiedFacts: TUnverifiedFact[]) => Promise<TTripRun | undefined>
  updateTripRunExclusions: (runId: string, exclusions: TRunExclusion[]) => Promise<void>
  updateTripRunDraftPlan: (runId: string, draftPlan: TSavedPlan) => Promise<void>
  incrementTripRunRejections: (runId: string) => Promise<number>
  // Only settles a run that is still queued or running, so a late second finisher is a no-op
  finishTripRun: (
    runId: string,
    status: ERunStatus.SUCCEEDED | ERunStatus.FAILED,
    failureReason: string | null,
    notificationStatus: ENotificationStatus.PENDING | ENotificationStatus.SKIPPED
  ) => Promise<TTripRun | undefined>
  // Only settles a pending notification, so a second sender (boot sweep vs a late old process) writes nothing
  settleTripRunNotification: (
    runId: string,
    status: ENotificationStatus.SENT | ENotificationStatus.FAILED | ENotificationStatus.SKIPPED,
    ref: string | null
  ) => Promise<TTripRun | undefined>
  // Oldest first
  findPendingNotificationTripRuns: (finishedBefore: Date) => Promise<TTripRun[]>
  expirePendingNotifications: (finishedBefore: Date) => Promise<number>
}

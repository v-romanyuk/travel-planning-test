import { failRun } from './failRun'
import { RUN_FAILURE } from './runMessages'

import { useQueueService } from '~~/server/services/queue/queue.service'

// Called after the trip/run commit: a job sent inside the tx could start before the rows exist
export const enqueuePlanRun = async (tripId: string, runId: string) => {
  const jobId = await useQueueService().sendPlanTripJob({ tripId, runId }).catch((error: unknown) => {
    console.error('[planning] enqueue failed', tripId, error instanceof Error ? error.message : error)

    return null
  })

  if (!jobId) await failRun(tripId, runId, RUN_FAILURE.notStarted)
}

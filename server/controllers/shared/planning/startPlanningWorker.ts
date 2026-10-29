import { failRun } from './failRun'
import { RUN_FAILURE } from './runMessages'
import { runPlanTripJob } from './runPlanTripJob'
import { sweepPendingNotifications } from './sweepPendingNotifications'

import { repos } from '~~/server/repos'
import { useQueueService } from '~~/server/services/queue/queue.service'
import { ERunStatus } from '~~/shared/schemas/trips/RunStatus'

// A crash between the trip commit and the send leaves a run with no job at all. Jobs a dead process held
// are not handled here: their heartbeat stops and pg-boss retries them (they resume from their checkpoint)
const requeueRunsWithoutJob = async () => {
  const queue = useQueueService()
  const openRuns = await repos.tripRunsRepo.findTripRunsByStatuses([ERunStatus.QUEUED, ERunStatus.RUNNING])
  const jobsByRun = await Promise.all(openRuns.map(run => queue.findPlanTripJobsByRunId(run.id)))
  const jobless = openRuns.filter((_, i) => jobsByRun[i]!.length === 0)

  await Promise.all(jobless.map(run => queue.sendPlanTripJob({ tripId: run.tripId, runId: run.id })))
  if (jobless.length > 0) console.info('[planning] boot recovery: re-queued runs', jobless.length)
}

/**
 * Boot: re-queue runs that never got a job, start the run and dead-letter workers, then sweep unsent WhatsApp
 * messages in the background. Safe to call again after a failure.
 */
export const startPlanningWorker = async () => {
  const queue = useQueueService()
  await requeueRunsWithoutJob()

  // A job that exhausted its retry (crash twice, or pg-boss expiry) still has to leave the trip readable
  await queue.workDeadPlanTripJobs(async ({ tripId, runId }) => {
    await failRun(tripId, runId, RUN_FAILURE.stopped)
  })
  await queue.workPlanTripJobs(useRuntimeConfig().agentWorkerConcurrency, runPlanTripJob)

  // Reached once per boot (a failed start throws before it); not awaited, so it never holds up the workers
  void sweepPendingNotifications()
}

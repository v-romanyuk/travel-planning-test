import { notificationStatusFor, onRunFinished } from './onRunFinished'
import { buildFailedMessage } from './runMessages'

import { buildRepos } from '~~/server/repos'
import { EMessageAuthor } from '~~/shared/schemas/trips/MessageAuthor'
import { EMessageKind } from '~~/shared/schemas/trips/MessageKind'
import { ERunStatus } from '~~/shared/schemas/trips/RunStatus'
import { ETripStatus } from '~~/shared/schemas/trips/TripStatus'

/**
 * Ends a run as failed: trip `failed` with the reason, a templated message, previous items untouched.
 * A no-op (returns false) when the run is already settled, so racing finishers can't double-write.
 */
export const failRun = async (tripId: string, runId: string, reason: string) => {
  const failed = await useDrizzle().transaction(async (tx) => {
    const txRepos = buildRepos(tx)
    const trip = await txRepos.tripsRepo.findTripByIdUnscoped(tripId)
    const run = await txRepos.tripRunsRepo.finishTripRun(runId, ERunStatus.FAILED, reason, notificationStatusFor(trip))
    if (!run) return false

    const runs = await txRepos.tripRunsRepo.findTripRunsByTripId(tripId)
    const replanned = runs.some(other => other.status === ERunStatus.SUCCEEDED)

    await Promise.all([
      txRepos.tripsRepo.updateTripStatus(tripId, ETripStatus.FAILED, reason),
      txRepos.tripMessagesRepo.insertTripMessages([
        { tripId, author: EMessageAuthor.AGENT, kind: EMessageKind.FAILED, body: buildFailedMessage(reason, replanned) }
      ])
    ])

    return true
  })

  if (failed) {
    console.warn('[planning] run failed', tripId, runId)
    await onRunFinished(runId)
  }

  return failed
}

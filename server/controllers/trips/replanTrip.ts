import { getTrip } from './getTrip'

import { enqueuePlanRun } from '~~/server/controllers/shared/planning/enqueuePlanRun'
import { buildRepos, repos } from '~~/server/repos'
import type { TUser } from '~~/server/types/user/User'
import { createUserError } from '~~/server/utils/errorUtils'
import { ACK_MESSAGE, REPLAN_ACK_MESSAGE } from '~~/shared/constants/trips'
import { EMessageAuthor } from '~~/shared/schemas/trips/MessageAuthor'
import { EMessageKind } from '~~/shared/schemas/trips/MessageKind'
import { ERunStatus } from '~~/shared/schemas/trips/RunStatus'

const alreadyPlanning = () => createUserError({ statusCode: 409, message: 'This trip is already being planned.' })

// The previous plan stays visible (and read-only) until the new run replaces it; a fresh agent thread reads the edited trip
export const replanTrip = async (user: TUser, tripId: string) => {
  const [existing, runs] = await Promise.all([
    repos.tripsRepo.findTripById(user.id, tripId),
    repos.tripRunsRepo.findTripRunsByTripId(tripId)
  ])
  if (!existing) throw createUserError({ statusCode: 404, message: 'This trip wasn\'t found.' })

  // "Try again" after a failed first run is a first plan, not a re-plan
  const ack = runs.some(run => run.status === ERunStatus.SUCCEEDED) ? REPLAN_ACK_MESSAGE : ACK_MESSAGE

  const run = await useDrizzle().transaction(async (tx) => {
    const txRepos = buildRepos(tx)
    // Conditional update: two concurrent re-plans can't both flip the trip, so only one run starts
    const trip = await txRepos.tripsRepo.markTripPlanning(user.id, tripId)
    if (!trip) throw alreadyPlanning()

    const [run] = await Promise.all([
      txRepos.tripRunsRepo.insertTripRun(tripId),
      txRepos.tripMessagesRepo.insertTripMessages([
        { tripId, author: EMessageAuthor.AGENT, kind: EMessageKind.ACK, body: ack }
      ])
    ])

    return run
  })

  await enqueuePlanRun(tripId, run.id)

  return getTrip(user, tripId)
}

import { getTrip } from './getTrip'

import { buildRepos } from '~~/server/repos'
import type { TTripDayUpdate } from '~~/server/types/repos/ITripDaysRepo'
import type { TUser } from '~~/server/types/user/User'
import { createUserError } from '~~/server/utils/errorUtils'
import type { TUpdateTripDayReq } from '~~/shared/schemas/trips/UpdateTripDayReqSchema'
import { ETripStatus } from '~~/shared/schemas/trips/TripStatus'

const notFound = (message: string) => createUserError({ statusCode: 404, message })

const toDayUpdate = (req: TUpdateTripDayReq): TTripDayUpdate => ({
  // A typed title is the traveller's and survives re-plans; a cleared one hands the day back to the planner
  ...(req.title !== undefined && { title: req.title || null, titleSetByTraveller: Boolean(req.title) }),
  ...(req.note !== undefined && { note: req.note || null })
})

/** "Save day": every change to one day in one transaction, rejected as a whole while the trip is planning. */
export const updateTripDay = async (user: TUser, tripId: string, dayId: string, req: TUpdateTripDayReq) => {
  const itemIds = [...new Set([...req.removedItemIds, ...req.itemNotes.map(itemNote => itemNote.itemId)])]

  await useDrizzle().transaction(async (tx) => {
    const txRepos = buildRepos(tx)
    // Locked, so a re-plan can't start until this save commits
    const trip = await txRepos.tripsRepo.findTripByIdForUpdate(user.id, tripId)
    if (!trip) throw notFound('This trip wasn\'t found.')
    if (trip.status === ETripStatus.PLANNING) {
      throw createUserError({ statusCode: 409, message: 'This trip is being planned. You can edit it when planning finishes.' })
    }

    const [day, items] = await Promise.all([
      txRepos.tripDaysRepo.findTripDayById(tripId, dayId),
      txRepos.tripItemsRepo.findTripItemsByDayIdAndIds(dayId, itemIds)
    ])
    if (!day) throw notFound('This day wasn\'t found in the trip.')
    if (items.length !== itemIds.length) throw notFound('One of the items isn\'t in this day.')

    await Promise.all([
      txRepos.tripDaysRepo.updateTripDay(tripId, dayId, toDayUpdate(req)),
      txRepos.tripItemsRepo.markTripItemsRemoved(dayId, req.removedItemIds),
      ...req.itemNotes.map(({ itemId, note }) => txRepos.tripItemsRepo.updateTripItemNote(dayId, itemId, note || null))
    ])
  })

  return getTrip(user, tripId)
}

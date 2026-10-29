import dayjs from 'dayjs'

import { getTrip } from './getTrip'

import { enqueuePlanRun } from '~~/server/controllers/shared/planning/enqueuePlanRun'
import { listTripDates } from '~~/server/controllers/shared/planning/planTime'
import { buildRepos, repos } from '~~/server/repos'
import type { TPerson } from '~~/server/types/knowledge-graph/Person'
import type { TUser } from '~~/server/types/user/User'
import { createUserError } from '~~/server/utils/errorUtils'
import { ACK_MESSAGE } from '~~/shared/constants/trips'
import type { TCreateTripReq } from '~~/shared/schemas/trips/CreateTripReqSchema'
import { EMessageAuthor } from '~~/shared/schemas/trips/MessageAuthor'
import { EMessageKind } from '~~/shared/schemas/trips/MessageKind'
import { ETripStatus } from '~~/shared/schemas/trips/TripStatus'

const formatDate = (date: string) => dayjs(date).format('D MMM YYYY')

const buildRequestMessage = (req: TCreateTripReq, companions: TPerson[]) => [
  `Plan a trip from ${req.origin.name} to ${req.destination.name}, ${formatDate(req.startDate)} – ${formatDate(req.endDate)},`,
  companions.length > 0 ? ` with ${companions.map(c => c.name).join(', ')}.` : ' just me.',
  req.notes ? `\nNotes: ${req.notes}` : '',
  req.whatsappOptIn ? '\nMessage me on WhatsApp when it\'s ready.' : ''
].join('')

export const createTrip = async (user: TUser, req: TCreateTripReq) => {
  // Created with the user at signup
  const traveller = await repos.peopleRepo.findTravellerByUserId(user.id)
  if (!traveller) throw new Error('user has no traveller person')

  const companionIds = [...new Set(req.companionIds)].filter(id => id !== traveller.id)
  const companions = await repos.peopleRepo.findPeopleByIds(user.id, companionIds)
  if (companions.length !== companionIds.length) {
    throw createUserError({ statusCode: 404, message: 'One of the companions wasn\'t found.' })
  }

  const days = listTripDates(req.startDate, req.endDate)

  const { trip, run } = await useDrizzle().transaction(async (tx) => {
    const txRepos = buildRepos(tx)
    const trip = await txRepos.tripsRepo.insertTrip({
      userId: user.id,
      origin: req.origin,
      destination: req.destination,
      startDate: req.startDate,
      endDate: req.endDate,
      notes: req.notes || null,
      timeZone: req.timeZone,
      status: ETripStatus.PLANNING,
      whatsappOptIn: req.whatsappOptIn,
      // Not stored without consent
      whatsappNumber: req.whatsappOptIn ? req.whatsappNumber : null
    })

    const [run] = await Promise.all([
      txRepos.tripRunsRepo.insertTripRun(trip.id),
      // The traveller is always on the trip
      txRepos.tripTravellersRepo.insertTripTravellers(trip.id, [traveller.id, ...companionIds]),
      txRepos.tripDaysRepo.insertTripDays(days.map((date, position) => ({ tripId: trip.id, position, date }))),
      txRepos.tripMessagesRepo.insertTripMessages([
        {
          tripId: trip.id,
          author: EMessageAuthor.TRAVELLER,
          kind: EMessageKind.REQUEST,
          body: buildRequestMessage(req, companions)
        },
        { tripId: trip.id, author: EMessageAuthor.AGENT, kind: EMessageKind.ACK, body: ACK_MESSAGE }
      ])
    ])

    return { trip, run }
  })

  await enqueuePlanRun(trip.id, run.id)

  return getTrip(user, trip.id)
}

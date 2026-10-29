import { repos } from '~~/server/repos'
import { createUserError } from '~~/server/utils/errorUtils'
import type { TUser } from '~~/server/types/user/User'
import { EPersonRole } from '~~/shared/schemas/knowledge-graph/PersonRole'
import { ERunStatus } from '~~/shared/schemas/trips/RunStatus'

export const getTrip = async (user: TUser, tripId: string) => {
  const trip = await repos.tripsRepo.findTripById(user.id, tripId)
  if (!trip) throw createUserError({ statusCode: 404, message: 'This trip wasn\'t found.' })

  const [people, days, items, gaps, messages, runs] = await Promise.all([
    repos.peopleRepo.findPeopleByTripId(user.id, tripId),
    repos.tripDaysRepo.findTripDaysByTripId(tripId),
    repos.tripItemsRepo.findTripItemsByTripId(tripId),
    repos.tripGapsRepo.findTripGapsByTripId(tripId),
    repos.tripMessagesRepo.findTripMessagesByTripId(tripId),
    repos.tripRunsRepo.findTripRunsByTripId(tripId)
  ])

  const liveItemsByDay = Map.groupBy(items.filter(item => item.removedAt === null), item => item.dayId)
  const [latestRun] = runs
  // Items on screen come from the newest succeeded run, also while a re-plan runs or after it failed
  const planRun = runs.find(run => run.status === ERunStatus.SUCCEEDED)
  // Describe the plan on screen; before any plan, the run that has started checking facts
  const unverifiedFacts = (planRun ?? runs.find(run => run.startedAt !== null))?.unverifiedFacts ?? []

  return {
    ...trip,
    companionIds: people.filter(person => person.role === EPersonRole.COMPANION).map(person => person.id),
    travellers: people
      .map(person => ({ id: person.id, name: person.name ?? user.fullName, role: person.role }))
      .sort((a, b) => Number(b.role === EPersonRole.TRAVELLER) - Number(a.role === EPersonRole.TRAVELLER)),
    days: days.map(day => ({
      ...day,
      items: (liveItemsByDay.get(day.id) ?? []).map(item => ({
        ...item,
        time: item.time.slice(0, 5),
        endTime: item.endTime?.slice(0, 5) ?? null,
        price: item.priceAmount !== null && item.priceCurrency
          ? { amount: item.priceAmount, currency: item.priceCurrency, unit: item.priceUnit ?? '' }
          : null
      }))
    })),
    gaps,
    unverifiedFacts,
    messages,
    latestRun: latestRun ?? null,
    planRun: planRun
      ? {
        id: planRun.id,
        finishedAt: planRun.finishedAt!,
        exclusions: planRun.exclusions,
        unmetRequests: planRun.draftPlan?.unmetRequests ?? []
      }
      : null
  }
}

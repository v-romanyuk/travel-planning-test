import { carryItemNotes } from './carryItemNotes'
import { notificationStatusFor, onRunFinished } from './onRunFinished'
import { addMinutes } from './planTime'
import { buildReadyMessage } from './runMessages'

import { buildRepos } from '~~/server/repos'
import type { TCatalogueEntry } from '~~/server/types/catalogue/CatalogueEntry'
import type { TInsertTripItem } from '~~/server/types/trips/InsertTripItem'
import type { TSavedPlan } from '~~/server/types/trips/SavedPlan'
import type { TTripDay } from '~~/server/types/trips/TripDay'
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'
import { EMessageAuthor } from '~~/shared/schemas/trips/MessageAuthor'
import { EMessageKind } from '~~/shared/schemas/trips/MessageKind'
import { ERunStatus } from '~~/shared/schemas/trips/RunStatus'
import { ETripStatus } from '~~/shared/schemas/trips/TripStatus'

interface IFinishRunArgs {
  tripId: string
  runId: string
  plan: TSavedPlan
  days: TTripDay[]
  entriesByRef: Map<string, TCatalogueEntry>
}

// Name, price and times come from the catalogue row, never from the agent
const toTripItem = (tripId: string, dayId: string, position: number, entry: TCatalogueEntry, item: TSavedPlan['days'][number]['items'][number]): TInsertTripItem => {
  const base = {
    tripId,
    dayId,
    position,
    kind: entry.kind,
    catalogueEntryId: entry.id,
    source: entry.ref,
    name: entry.name,
    time: item.time,
    priceAmount: entry.priceAmount,
    priceCurrency: entry.priceCurrency,
    priceUnit: entry.priceUnit,
    why: item.why,
    citedFacts: item.citedFacts,
    status: 'planned' as const
  }

  if (entry.kind === EItemKind.TRANSPORT) {
    const { departs, arrives, arrivesNextDay, toCityName } = entry.attributes

    const transport = { from: entry.cityName, to: toCityName, departs, arrives, arrivesNextDay }

    return { ...base, time: departs, endTime: arrives, transport }
  }
  if (entry.kind === EItemKind.PLACE && entry.attributes.durationMin) {
    return { ...base, endTime: addMinutes(item.time, entry.attributes.durationMin), transport: null }
  }

  return { ...base, endTime: null, transport: null }
}

/**
 * Writes an accepted plan in one transaction and sets the trip `ready`; previous live items and gaps are replaced,
 * their notes carried over (`carryItemNotes`).
 */
export const finishRun = async ({ tripId, runId, plan, days, entriesByRef }: IFinishRunArgs) => {
  const dayByDate = new Map(days.map(day => [day.date, day]))
  const items = plan.days.flatMap((planDay) => {
    const day = dayByDate.get(planDay.date)
    if (!day) return []

    return planDay.items.map((item, position) => toTripItem(tripId, day.id, position, entriesByRef.get(item.ref)!, item))
  })
  // A planner title describes that plan only: each run replaces it, or clears it when the new plan gives none,
  // so a re-plan never keeps "Day trip to Sintra" over a day without Sintra. The traveller's own titles stay
  const titleByDate = new Map(plan.days.map(planDay => [planDay.date, planDay.title ?? null]))
  const titles = days
    .filter(day => !day.titleSetByTraveller)
    .map(day => ({ day, title: titleByDate.get(day.date) ?? null }))
    .filter(({ day, title }) => title !== day.title)

  const finished = await useDrizzle().transaction(async (tx) => {
    const txRepos = buildRepos(tx)
    const trip = await txRepos.tripsRepo.findTripByIdUnscoped(tripId)
    const run = await txRepos.tripRunsRepo.finishTripRun(runId, ERunStatus.SUCCEEDED, null, notificationStatusFor(trip))
    if (!run) return false

    const [previous, runs] = await Promise.all([
      txRepos.tripItemsRepo.findTripItemsByTripId(tripId),
      txRepos.tripRunsRepo.findTripRunsByTripId(tripId)
    ])
    const replanned = runs.some(other => other.id !== runId && other.status === ERunStatus.SUCCEEDED)
    const carried = carryItemNotes(previous, items, days)

    await Promise.all([
      txRepos.tripItemsRepo.deleteLiveTripItemsByTripId(tripId),
      txRepos.tripGapsRepo.deleteTripGapsByTripId(tripId)
    ])
    await Promise.all([
      txRepos.tripItemsRepo.insertTripItems(carried.items),
      ...[...carried.dayNotes].map(([dayId, note]) => txRepos.tripDaysRepo.updateTripDay(tripId, dayId, { note })),
      txRepos.tripGapsRepo.insertTripGaps(plan.gaps.map(gap => ({ tripId, ...gap }))),
      ...titles.map(({ day, title }) => txRepos.tripDaysRepo.setPlannerDayTitle(day.id, title)),
      txRepos.tripsRepo.updateTripStatus(tripId, ETripStatus.READY, null),
      txRepos.tripMessagesRepo.insertTripMessages([
        { tripId, author: EMessageAuthor.AGENT, kind: EMessageKind.READY, body: buildReadyMessage(plan, replanned) }
      ])
    ])

    return true
  })

  if (finished) {
    console.info('[planning] run succeeded', tripId, runId)
    await onRunFinished(runId)
  }

  return finished
}

import type { IPlacedItem, IPlanContext, IPlanIssue } from './planContext'
import { hasGap, isInbound, isOutbound, isTransport, label } from './planContext'

import { EPlaceCategory } from '~~/shared/schemas/catalogue/PlaceCategory'
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'

const MIN_PLACES_PER_DAY = 2
const MAX_PLACES_PER_DAY = 4

const drop = (message: string, item: IPlacedItem): IPlanIssue => ({ message, fix: { drop: item } })

const addGap = (message: string, kind: EItemKind, date: string | null): IPlanIssue => ({
  message,
  fix: { addGap: { kind, date } }
})

const isFood = ({ entry }: IPlacedItem) => entry.kind === EItemKind.PLACE && entry.attributes.category === EPlaceCategory.FOOD

const checkGapDates = (ctx: IPlanContext): IPlanIssue[] => ctx.gaps
  .filter(gap => gap.date && !ctx.dates.includes(gap.date))
  .map(gap => ({ message: `Gap date ${gap.date} is not a date of this trip.`, fix: { dropGap: gap } }))

// One stay covers every night and sits on day 1; a same-day trip has none
const checkStay = (ctx: IPlanContext, items: IPlacedItem[]): IPlanIssue[] => {
  const nights = ctx.dates.length - 1
  const stays = items.filter(item => item.entry.kind === EItemKind.STAY)
  if (nights === 0) return stays.map(stay => drop('This trip has no nights, so it needs no stay.', stay))

  const [stay, ...extra] = stays
  if (!stay) {
    return hasGap(ctx, EItemKind.STAY, null)
      ? []
      : [addGap(`No stay for the ${nights} night(s): add one or state a stay gap.`, EItemKind.STAY, null)]
  }

  const issues = extra.map(item => drop('Use one stay for the whole trip, placed on the first day.', item))
  if (stay.date !== ctx.firstDate || stay.entry.cityId !== ctx.trip.destination.id) {
    issues.push(drop(`The stay ${label(stay.entry)} must be at the destination and placed on ${ctx.firstDate}.`, stay))
  }

  return issues
}

// Transport is the trip's two legs, or a hop between the destination and a nearby city
const checkTransport = (ctx: IPlanContext, date: string, dayItems: IPlacedItem[]): IPlanIssue[] => {
  const { origin, destination } = ctx.trip
  const issues: IPlanIssue[] = []

  for (const item of dayItems) {
    if (!isTransport(item.entry) || isOutbound(ctx, item) || isInbound(ctx, item)) continue
    const { cityId, attributes: { toCityId } } = item.entry
    const leavesDestination = cityId === destination.id && toCityId !== origin.id
    const returnsToDestination = toCityId === destination.id && cityId !== origin.id
    if (!leavesDestination && !returnsToDestination) {
      issues.push(drop(
        `${label(item.entry)} doesn't fit this day; trip legs go ${origin.name} → ${destination.name} on ${ctx.firstDate} and back on ${ctx.lastDate}.`,
        item
      ))
    }
  }

  const missingGap = !hasGap(ctx, EItemKind.TRANSPORT, date)
  if (date === ctx.firstDate && missingGap && !dayItems.some(item => isOutbound(ctx, item))) {
    issues.push(addGap(`no transport from ${origin.name} to ${destination.name}: add one or state a transport gap for this date.`, EItemKind.TRANSPORT, date))
  }
  if (date === ctx.lastDate && missingGap && !dayItems.some(item => isInbound(ctx, item))) {
    issues.push(addGap(`no transport back to ${origin.name}: add one or state a transport gap for this date.`, EItemKind.TRANSPORT, date))
  }

  return issues
}

// Over the limit, the day keeps its first food place and then the earliest others
const checkPlaceCount = (ctx: IPlanContext, date: string, places: IPlacedItem[]): IPlanIssue[] => {
  const issues: IPlanIssue[] = []
  if (places.length > MAX_PLACES_PER_DAY) {
    const food = places.find(isFood)
    const kept = new Set([...(food ? [food] : []), ...places].slice(0, MAX_PLACES_PER_DAY))
    const message = `${places.length} places; plan at most ${MAX_PLACES_PER_DAY} a day.`
    issues.push(...places.filter(place => !kept.has(place)).map(place => drop(message, place)))
  }

  if ((places.length < MIN_PLACES_PER_DAY || !places.some(isFood)) && !hasGap(ctx, EItemKind.PLACE, date)) {
    issues.push(addGap(
      `plan ${MIN_PLACES_PER_DAY}–${MAX_PLACES_PER_DAY} places including at least one food place, or state a place gap for this date.`,
      EItemKind.PLACE,
      date
    ))
  }

  return issues
}

// Places fit between arrival and the way home; a place outside the destination needs a hop there that arrives first.
// The origin is never a place's city: the traveller is away from it for the whole trip
const checkPlaceReach = (ctx: IPlanContext, dayItems: IPlacedItem[], places: IPlacedItem[]): IPlanIssue[] => {
  const { origin, destination } = ctx.trip
  const transports = dayItems.flatMap(item => isTransport(item.entry) ? [item.entry] : [])
  const outbound = dayItems.find(item => isOutbound(ctx, item))
  const inbound = dayItems.find(item => isInbound(ctx, item))
  const arrival = outbound && isTransport(outbound.entry) ? outbound.entry.attributes : undefined
  const issues: IPlanIssue[] = []

  for (const place of places) {
    const { cityId, cityName } = place.entry
    if (cityId === origin.id) {
      issues.push(drop(`${label(place.entry)} is in ${origin.name}, where the trip starts; plan places in ${destination.name} or a city near it.`, place))
    } else if (cityId !== destination.id) {
      const hop = transports.find(t => t.attributes.toCityId === cityId)
      if (!hop) {
        issues.push(drop(`${label(place.entry)} is in ${cityName}; it needs transport to ${cityName} on the same day.`, place))
      } else if (!hop.attributes.arrivesNextDay && place.time < hop.attributes.arrives) {
        issues.push(drop(`${label(place.entry)} at ${place.time} is before the arrival in ${cityName} at ${hop.attributes.arrives}.`, place))
      }
    }
    if (arrival && !arrival.arrivesNextDay && place.time < arrival.arrives) {
      issues.push(drop(`${label(place.entry)} at ${place.time} is before the arrival at ${arrival.arrives}.`, place))
    }
    if (inbound && place.time >= inbound.time) {
      issues.push(drop(`${label(place.entry)} at ${place.time} is after the departure home at ${inbound.time}.`, place))
    }
  }

  return issues
}

/**
 * Whole-plan shape: stay, both legs, 2–4 places a day with food — each missing piece placed or stated as a gap.
 * Every issue carries the fix code applies when it salvages the plan: drop the item, or state the gap.
 */
export const checkPlanRules = (ctx: IPlanContext, items: IPlacedItem[]): IPlanIssue[] => {
  const dayIssues = ctx.dates.flatMap((date) => {
    const dayItems = items.filter(item => item.date === date)
    const places = dayItems.filter(item => item.entry.kind === EItemKind.PLACE)

    return [
      ...checkTransport(ctx, date, dayItems),
      ...checkPlaceCount(ctx, date, places),
      ...checkPlaceReach(ctx, dayItems, places)
    ].map(issue => ({ ...issue, message: `${date}: ${issue.message}` }))
  })

  return [...checkGapDates(ctx), ...checkStay(ctx, items), ...dayIssues]
}

import type { IPlanContext, IPlanGap } from './planContext'
import { isTransport } from './planContext'

import type { TRunExclusion } from '~~/shared/schemas/trips/RunExclusionSchema'
import type { TUnmetRequest } from '~~/shared/schemas/trips/UnmetRequestSchema'
import { EGapReason } from '~~/shared/schemas/trips/GapReason'
import { EUnmetReason } from '~~/shared/schemas/trips/UnmetReason'

// The candidates a gap of this kind on this date stands for: the trip legs on the first and last day,
// day-trip legs on the days between, and every stay or place the run could use
const relevantEntries = (ctx: IPlanContext, gap: IPlanGap) => [...ctx.entriesByRef.values()].filter((entry) => {
  if (entry.kind !== gap.kind) return false
  if (!isTransport(entry)) return true

  const { origin, destination } = ctx.trip
  const outbound = entry.cityId === origin.id && entry.attributes.toCityId === destination.id
  const inbound = entry.cityId === destination.id && entry.attributes.toCityId === origin.id
  if (!gap.date) return outbound || inbound
  if (gap.date === ctx.firstDate) return outbound
  if (gap.date === ctx.lastDate) return inbound

  return entry.cityId === destination.id && entry.attributes.toCityId !== origin.id
})

// Capitalised words of a request: the place names a traveller writes ("visit Sintra")
const namedPlaces = (request: string) => new Set([...request.matchAll(/\p{Lu}[\p{L}'-]{2,}/gu)].map(([word]) => word.toLowerCase()))

/**
 * "Not in the catalogue" is a fact code can check against the run's candidates and exclusions, so the agent's
 * reason is corrected rather than trusted: when hard constraints removed the options, the plan must say a rule did.
 * Only that direction is corrected — code can't tell whether a kept option would have fitted.
 */
export const correctReasons = (ctx: IPlanContext, unmetRequests: TUnmetRequest[], exclusions: TRunExclusion[]) => {
  const excludedRefs = new Set(exclusions.map(exclusion => exclusion.ref))

  const gaps = ctx.gaps.map((gap) => {
    if (gap.reason !== EGapReason.NONE_IN_CATALOGUE) return gap

    const relevant = relevantEntries(ctx, gap)
    const allExcluded = relevant.length > 0 && relevant.every(entry => excludedRefs.has(entry.ref))

    return allExcluded ? { ...gap, reason: EGapReason.ALL_EXCLUDED } : gap
  })

  // Cities a rule cut off: where removed legs go. A removed restaurant in Lisbon doesn't make "Lisbon" unreachable
  const excludedCities = new Set([...excludedRefs]
    .flatMap(ref => ctx.entriesByRef.get(ref) ?? [])
    .flatMap(entry => isTransport(entry) && entry.attributes.toCityId !== ctx.trip.origin.id
      ? [entry.attributes.toCityName.toLowerCase()]
      : []))

  const unmet = unmetRequests.map((request) => {
    if (request.reason !== EUnmetReason.NOT_IN_CATALOGUE) return request

    const names = namedPlaces(request.request)

    return [...names].some(name => excludedCities.has(name)) ? { ...request, reason: EUnmetReason.EXCLUDED_BY_RULE } : request
  })

  return { ctx: { ...ctx, gaps }, unmetRequests: unmet }
}

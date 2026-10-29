import type { IRunFacts } from '../factRules'
import type { TPlanningClock } from '../planTime'

import type { TSavePlanInput } from '~~/server/types/agent/SavePlanInput'
import type { TCatalogueEntry } from '~~/server/types/catalogue/CatalogueEntry'
import type { TCitedFact } from '~~/shared/schemas/trips/CitedFactSchema'
import type { TTrip } from '~~/server/types/trips/Trip'
import type { EGapReason } from '~~/shared/schemas/trips/GapReason'
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'

export type TTransportEntry = Extract<TCatalogueEntry, { kind: EItemKind.TRANSPORT }>

export interface IPlanContext {
  input: TSavePlanInput
  trip: TTrip
  dates: string[]
  firstDate: string
  lastDate: string
  entriesByRef: Map<string, TCatalogueEntry>
  facts: IRunFacts
  // Catalogue refs of items the traveller removed
  removedRefs: Set<string>
  clock: TPlanningClock
  // The agent's gaps, plus the ones code adds when it salvages a plan
  gaps: IPlanGap[]
  // The trip's notes and the day notes, which an unmet request must quote
  travellerNotes: string[]
}

export interface IPlanGap {
  kind: EItemKind
  date?: string | null
  reason: EGapReason
}

// One accepted plan item: catalogue entry resolved, times applied, citations checked
export interface IPlacedItem {
  date: string
  entry: TCatalogueEntry
  time: string
  why: string
  citedFacts: TCitedFact[]
}

// What code does about an issue when it salvages a plan instead of rejecting it; none = the item was never placed
export type TPlanFix =
  | { drop: IPlacedItem } |
  { addGap: { kind: EItemKind; date: string | null } } |
  { dropGap: IPlanGap }

export interface IPlanIssue {
  message: string
  fix?: TPlanFix
}

export const label = (entry: TCatalogueEntry) => `"${entry.name}" (${entry.ref})`

export const isTransport = (entry: TCatalogueEntry): entry is TTransportEntry => entry.kind === EItemKind.TRANSPORT

const isLeg = (entry: TCatalogueEntry, fromCityId: number, toCityId: number) => {
  return isTransport(entry) && entry.cityId === fromCityId && entry.attributes.toCityId === toCityId
}

export const isOutbound = (ctx: IPlanContext, item: IPlacedItem) => {
  return item.date === ctx.firstDate && isLeg(item.entry, ctx.trip.origin.id, ctx.trip.destination.id)
}

export const isInbound = (ctx: IPlanContext, item: IPlacedItem) => {
  return item.date === ctx.lastDate && isLeg(item.entry, ctx.trip.destination.id, ctx.trip.origin.id)
}

// A gap without a date covers the whole trip
export const hasGap = (ctx: IPlanContext, kind: EItemKind, date: string | null) => {
  return ctx.gaps.some(gap => gap.kind === kind && (date === null || !gap.date || gap.date === date))
}

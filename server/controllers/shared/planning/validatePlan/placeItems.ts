import { findMatchedPreferences, findViolatedFacts, toCitedFact } from '../factRules'
import { isWithinHours } from '../planTime'

import type { IPlacedItem, IPlanContext, IPlanIssue } from './planContext'
import { label } from './planContext'

import type { TSavePlanInput } from '~~/server/types/agent/SavePlanInput'
import type { TCatalogueEntry } from '~~/server/types/catalogue/CatalogueEntry'
import { ClockTimeSchema } from '~~/shared/schemas/catalogue/ClockTimeSchema'
import { EPreferenceKind } from '~~/shared/schemas/knowledge-graph/PreferenceKind'
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'

type TInputItem = TSavePlanInput['days'][number]['items'][number]

// Checks that drop the item: the first one that fails is reported, the rest would only repeat it
const findBlockingError = (ctx: IPlanContext, entry: TCatalogueEntry, item: TInputItem, usedRefs: Set<string>) => {
  const violated = findViolatedFacts(entry, ctx.facts.hard)
  if (violated.length > 0) {
    return `${label(entry)} breaks the hard constraint ${violated.map(f => `"${f.value}"`).join(', ')}.`
  }
  if (ctx.removedRefs.has(entry.ref) && !item.readdsRemoved) {
    return `${label(entry)} was removed by the traveller. Leave it out, or set readdsRemoved with the reason in why.`
  }
  if (entry.kind !== EItemKind.TRANSPORT && usedRefs.has(entry.ref)) {
    return `${label(entry)} is already in the plan; use each stay and place once.`
  }
}

// Transport and stays take their times from the catalogue; only a place's visit time is the agent's choice
const resolveTime = (entry: TCatalogueEntry, time: string): { time: string } | { error: string } => {
  if (entry.kind === EItemKind.TRANSPORT) return { time: entry.attributes.departs }
  if (entry.kind === EItemKind.STAY) return { time: entry.attributes.checkIn }
  if (!ClockTimeSchema.safeParse(time).success) return { error: `${label(entry)} needs a time as HH:mm.` }

  const { opensAt, closesAt } = entry.attributes
  if (opensAt && closesAt && !isWithinHours(time, opensAt, closesAt)) {
    return { error: `${label(entry)} at ${time} is outside its opening hours ${opensAt}–${closesAt}.` }
  }

  return { time }
}

// A checkable preference is cited only when the entry really matches it; one code can't check is the planner's call
const resolveCitations = (ctx: IPlanContext, entry: TCatalogueEntry, item: TInputItem) => {
  const errors: string[] = []
  const citedFacts: IPlacedItem['citedFacts'] = []

  for (const factId of item.citedFactIds) {
    const preference = ctx.facts.preferences.find(fact => fact.id === factId)
    const unchecked = ctx.facts.unenforceable.find(fact => fact.id === factId && fact.kind === EPreferenceKind.PREFERENCE)
    if (unchecked) {
      citedFacts.push(toCitedFact(unchecked, ctx.facts))
    } else if (!preference) {
      errors.push(`${label(entry)} cites ${factId}, which is not a stored preference. Cite only ids from matchesPreferences or not-checkable preferences.`)
    } else if (findMatchedPreferences(entry, [preference]).length === 0) {
      errors.push(`${label(entry)} doesn't match the preference "${preference.value}", so it can't cite it.`)
    } else {
      citedFacts.push(toCitedFact(preference, ctx.facts))
    }
  }

  return { citedFacts, errors }
}

const checkWhy = (ctx: IPlanContext, entry: TCatalogueEntry, item: TInputItem) => {
  if (!item.why.trim()) return [`${label(entry)} needs a why.`]
  // With notes, an uncited why may quote them instead — that can't be checked mechanically
  if (item.citedFactIds.length === 0 && !ctx.trip.notes && !/no stored preference/i.test(item.why)) {
    return [`${label(entry)} cites no preference, so its why must say "No stored preference applied" (and then the reason).`]
  }

  return []
}

interface IPlaceResult { placed?: IPlacedItem; errors: string[] }

const placeItem = (ctx: IPlanContext, date: string, item: TInputItem, usedRefs: Set<string>): IPlaceResult => {
  const entry = ctx.entriesByRef.get(item.ref)
  if (!entry) return { errors: [`ref "${item.ref}" is not in the catalogue. Use refs from search_catalogue only.`] }

  const blocking = findBlockingError(ctx, entry, item, usedRefs)
  if (blocking) return { errors: [blocking] }

  const resolved = resolveTime(entry, item.time)
  if ('error' in resolved) return { errors: [resolved.error] }
  // A stay can be checked into late; transport and places can't start in the traveller's past
  const { notBefore } = ctx.clock
  if (date === notBefore?.date && entry.kind !== EItemKind.STAY && resolved.time < notBefore.time) {
    return { errors: [`${label(entry)} at ${resolved.time} is too soon: on ${date} nothing may start before ${notBefore.time}.`] }
  }
  // Only a placed item claims its ref, so a dropped one doesn't turn a later valid use into "already in the plan"
  usedRefs.add(entry.ref)

  const { citedFacts, errors } = resolveCitations(ctx, entry, item)
  const placed: IPlacedItem = { date, entry, time: resolved.time, why: item.why.trim(), citedFacts }

  return { placed, errors: [...errors, ...checkWhy(ctx, entry, item)] }
}

/**
 * Resolves every input item against the catalogue and the item-level rules; day-level rules run on the result.
 * An item that fails a check is either never placed or placed with a `drop` fix, so a salvaged plan leaves it out.
 */
export const placeItems = (ctx: IPlanContext) => {
  const issues: IPlanIssue[] = []
  const items: IPlacedItem[] = []
  const titles = new Map<string, string | null>()
  const usedRefs = new Set<string>()

  for (const day of ctx.input.days) {
    if (!ctx.dates.includes(day.date)) {
      issues.push({ message: `Day ${day.date} is not a date of this trip (${ctx.firstDate} to ${ctx.lastDate}).` })
      continue
    }
    if (titles.has(day.date)) {
      issues.push({ message: `Day ${day.date} appears more than once; send each date once.` })
      continue
    }
    titles.set(day.date, day.title?.trim() || null)

    for (const item of day.items) {
      const { placed, errors } = placeItem(ctx, day.date, item, usedRefs)
      issues.push(...errors.map(error => ({
        message: `${day.date}: ${error}`,
        ...(placed && { fix: { drop: placed } })
      })))
      if (placed) items.push(placed)
    }
  }

  return { items, titles, issues }
}

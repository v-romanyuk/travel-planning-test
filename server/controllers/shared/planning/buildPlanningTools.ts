import { tool } from '@langchain/core/tools'
import { z } from 'zod'

import type { IRunFacts } from './factRules'
import type { TPlanningClock } from './planTime'
import { exclusionKey, findMatchedPreferences, findViolatedFacts, toExclusions } from './factRules'
import { validatePlan } from './validatePlan/validatePlan'

import { repos } from '~~/server/repos'
import { SavePlanInputSchema } from '~~/server/types/agent/SavePlanInput'
import type { TSavePlanInput } from '~~/server/types/agent/SavePlanInput'
import { SearchCatalogueInputSchema } from '~~/server/types/agent/SearchCatalogueInput'
import type { TCatalogueEntry } from '~~/server/types/catalogue/CatalogueEntry'
import type { TPerson } from '~~/server/types/knowledge-graph/Person'
import type { TRunExclusion } from '~~/shared/schemas/trips/RunExclusionSchema'
import type { TTrip } from '~~/server/types/trips/Trip'
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'

// Two corrections; a third failing save is salvaged by code instead of rejected
export const MAX_PLAN_REJECTIONS = 3

interface IBuildPlanningToolsArgs {
  trip: TTrip
  runId: string
  dates: string[]
  travellers: { person: TPerson; name: string }[]
  facts: IRunFacts
  candidates: TCatalogueEntry[]
  exclusions: Map<string, TRunExclusion>
  clock: TPlanningClock
  // Aborted at the deadline or the final rejection; the model may still call tools after it
  signal: AbortSignal
  // Called when the last rejected plan can't be salvaged either: nothing would be left
  onRejectedOut: () => void
}

const RUN_OVER = 'The run is over. Stop without further tool calls.'

const toolResult = (value: unknown) => JSON.stringify(value)

/**
 * The agent's only tools. All reads go through repos; nothing here books, reserves, pays or contacts anyone.
 * Hard constraints are applied in code before the agent sees an entry, and save_plan re-checks everything.
 */
export const buildPlanningTools = (args: IBuildPlanningToolsArgs) => {
  const { trip, runId, dates, travellers, facts, candidates, exclusions, clock, signal, onRejectedOut } = args
  const nameById = new Map(travellers.map(t => [t.person.id, t.name]))

  const recordExclusions = async (found: TRunExclusion[]) => {
    const fresh = found.filter(exclusion => !exclusions.has(exclusionKey(exclusion)))
    if (fresh.length === 0) return
    fresh.forEach(exclusion => exclusions.set(exclusionKey(exclusion), exclusion))
    await repos.tripRunsRepo.updateTripRunExclusions(runId, [...exclusions.values()])
  }

  const readProfile = tool(() => toolResult({
    travellers: travellers.map(t => t.name),
    facts: [...facts.hard, ...facts.preferences, ...facts.unenforceable].map(fact => ({
      id: fact.id,
      appliesTo: fact.subjectPersonId ? nameById.get(fact.subjectPersonId) : 'everyone on the trip',
      kind: fact.kind,
      domain: fact.domain,
      value: fact.value,
      enforcement: fact.ruleSummary
        ? `checked by code: ${fact.ruleSummary}`
        : 'not checkable by code — judge it yourself from each result\'s name, description and attributes'
    })),
    ...(facts.preferences.length === 0 && { note: 'There are no stored checkable preferences for this trip.' })
  }), {
    name: 'read_profile',
    description: 'The travellers on this trip and the stored hard constraints and preferences that apply to it.',
    schema: z.object({})
  })

  const readTrip = tool(async () => {
    const [days, items] = await Promise.all([
      repos.tripDaysRepo.findTripDaysByTripId(trip.id),
      repos.tripItemsRepo.findTripItemsByTripId(trip.id)
    ])
    const itemsByDay = Map.groupBy(items, item => item.dayId)

    return toolResult({
      origin: { cityId: trip.origin.id, name: trip.origin.name },
      destination: { cityId: trip.destination.id, name: trip.destination.name },
      startDate: trip.startDate,
      endDate: trip.endDate,
      notes: trip.notes,
      travellers: travellers.map(t => t.name),
      days: days.map(day => ({
        date: day.date,
        title: day.title,
        titleSetByTraveller: day.titleSetByTraveller,
        note: day.note,
        currentItems: (itemsByDay.get(day.id) ?? []).map(item => ({
          ref: item.source,
          kind: item.kind,
          name: item.name,
          time: item.time.slice(0, 5),
          note: item.note,
          removedByTraveller: item.removedAt !== null
        }))
      }))
    })
  }, {
    name: 'read_trip',
    description: 'The trip as the traveller currently has it: cities, dates, notes, days with their titles and notes, and the current plan items including ones the traveller removed.',
    schema: z.object({})
  })

  const searchCatalogue = tool(async ({ kind, cityId, toCityId }) => {
    if (signal.aborted) return RUN_OVER

    const entries = await repos.catalogueEntriesRepo.findCatalogueEntriesByCities([cityId], kind)
    const inRoute = entries.filter(entry => toCityId === undefined ||
      (entry.kind === EItemKind.TRANSPORT && entry.attributes.toCityId === toCityId))

    const removed: TRunExclusion[] = []
    const results = inRoute.flatMap((entry) => {
      const violated = findViolatedFacts(entry, facts.hard)

      if (violated.length > 0) {
        removed.push(...toExclusions(entry, violated, facts))

        return []
      }

      return [{
        ref: entry.ref,
        name: entry.name,
        city: { cityId: entry.cityId, name: entry.cityName },
        description: entry.description,
        price: entry.priceAmount === null
          ? null
          : { amount: entry.priceAmount, currency: entry.priceCurrency, unit: entry.priceUnit },
        attributes: entry.attributes,
        matchesPreferences: findMatchedPreferences(entry, facts.preferences)
          .map(fact => ({ id: fact.id, value: fact.value }))
      }]
    })
    await recordExclusions(removed)

    const removedCount = new Set(removed.map(r => r.ref)).size

    return toolResult({
      results,
      removedByHardConstraints: removedCount,
      ...(results.length === 0 && {
        note: inRoute.length === 0
          ? 'The catalogue has nothing for this search (reason none_in_catalogue).'
          : 'Hard constraints removed every option (reason all_excluded).'
      })
    })
  }, {
    name: 'search_catalogue',
    description: 'Search the fixture catalogue. Entries breaking a hard constraint are already removed. Each result lists the stored preferences it matches.',
    schema: SearchCatalogueInputSchema
  })

  // A rejected plan the agent may never fix (it stops, or runs out of tries) is still worth salvaging
  let lastRejected: TSavePlanInput | undefined

  const checkPlan = async (input: TSavePlanInput) => {
    const refs = [...new Set(input.days.flatMap(day => day.items.map(item => item.ref)))]
    const [planEntries, items, days] = await Promise.all([
      repos.catalogueEntriesRepo.findCatalogueEntriesByRefs(refs),
      repos.tripItemsRepo.findTripItemsByTripId(trip.id),
      repos.tripDaysRepo.findTripDaysByTripId(trip.id)
    ])
    const entriesByRef = new Map([...candidates, ...planEntries].map(entry => [entry.ref, entry]))
    const removedRefs = new Set(items.filter(item => item.removedAt !== null).map(item => item.source))

    return validatePlan({
      input,
      trip,
      dates,
      entriesByRef,
      facts,
      removedRefs,
      clock,
      exclusions: [...exclusions.values()],
      travellerNotes: [trip.notes, ...days.map(day => day.note)].filter(note => note !== null),
      salvage: true
    })
  }

  const savePlan = tool(async (input) => {
    if (signal.aborted) return RUN_OVER

    const { errors, plan, salvaged } = await checkPlan(input)

    if (plan && !salvaged) {
      lastRejected = undefined
      await repos.tripRunsRepo.updateTripRunDraftPlan(runId, plan)

      return 'Plan saved. You are done — stop here without further tool calls.'
    }

    lastRejected = input
    const rejections = await repos.tripRunsRepo.incrementTripRunRejections(runId)
    if (rejections < MAX_PLAN_REJECTIONS) {
      return `Plan rejected (attempt ${rejections} of ${MAX_PLAN_REJECTIONS}). Fix every point and call save_plan once more:\n${errors.map(e => `- ${e}`).join('\n')}`
    }

    if (plan) {
      lastRejected = undefined
      await repos.tripRunsRepo.updateTripRunDraftPlan(runId, plan)

      return 'Plan saved: code left out every item that failed a check and listed those parts as gaps. Stop here without further tool calls.'
    }

    onRejectedOut()

    return 'Plan rejected again. The run is over.'
  }, {
    name: 'save_plan',
    description: 'Save the whole plan once it is complete. Code checks it; a rejected plan can be corrected and saved twice more.',
    schema: SavePlanInputSchema
  })

  // For a run whose agent stopped after a rejection without saving again
  const salvageLastAttempt = async () => {
    if (!lastRejected) return false

    const { plan } = await checkPlan(lastRejected)
    if (!plan) return false

    await repos.tripRunsRepo.updateTripRunDraftPlan(runId, plan)

    return true
  }

  return { tools: [readProfile, readTrip, searchCatalogue, savePlan], salvageLastAttempt }
}

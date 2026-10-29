import { buildPlanningTools } from './buildPlanningTools'
import { exclusionKey, findViolatedFacts, splitRunFacts, toExclusions } from './factRules'
import { failRun } from './failRun'
import { finishRun } from './finishRun'
import { buildPlanningMessage, PLANNING_SYSTEM_PROMPT } from './planningPrompt'
import { listTripDates, minutesBetween, planningClock } from './planTime'
import type { TTransportEntry } from './validatePlan/planContext'
import { RUN_FAILURE } from './runMessages'

import { repos } from '~~/server/repos'
import { useAgentService } from '~~/server/services/agent/agent.service'
import type { IPlanTripJob } from '~~/server/services/queue/queue.service'
import type { TCatalogueEntry } from '~~/server/types/catalogue/CatalogueEntry'
import type { TRunExclusion } from '~~/shared/schemas/trips/RunExclusionSchema'
import type { TTrip } from '~~/server/types/trips/Trip'
import type { TTripRun } from '~~/server/types/trips/TripRun'
import { ETransportMode } from '~~/shared/schemas/catalogue/TransportMode'
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'
import { ERunStatus } from '~~/shared/schemas/trips/RunStatus'

class RunStop extends Error {
  constructor (readonly reason: string) {
    super(reason)
  }
}

// A day trip: a train or bus from the destination of two hours at most. Flights don't count, or every city the
// destination flies to would become a candidate (and its rule exclusions would flood the plan)
const MAX_EXCURSION_LEG_MIN = 120

const isDayTripLeg = (entry: TCatalogueEntry, trip: TTrip): entry is TTransportEntry => entry.kind === EItemKind.TRANSPORT &&
  entry.cityId === trip.destination.id &&
  entry.attributes.toCityId !== trip.origin.id &&
  entry.attributes.mode !== ETransportMode.FLIGHT &&
  !entry.attributes.arrivesNextDay &&
  minutesBetween(entry.attributes.departs, entry.attributes.arrives) <= MAX_EXCURSION_LEG_MIN

// Destination entries, both trip legs, and day-trip towns from the destination (their places, stays and the way back)
const loadCandidates = async (trip: TTrip) => {
  const near = await repos.catalogueEntriesRepo.findCatalogueEntriesByCities([trip.origin.id, trip.destination.id])
  const excursionCityIds = new Set(near.flatMap(entry => isDayTripLeg(entry, trip) ? [entry.attributes.toCityId] : []))
  const far = await repos.catalogueEntriesRepo.findCatalogueEntriesByCities([...excursionCityIds])

  return [...near, ...far].filter((entry) => {
    if (entry.kind !== EItemKind.TRANSPORT) return entry.cityId !== trip.origin.id

    const { toCityId } = entry.attributes
    if (entry.cityId === trip.origin.id) return toCityId === trip.destination.id
    if (entry.cityId === trip.destination.id) return toCityId === trip.origin.id || isDayTripLeg(entry, trip)

    // From a day-trip town, only the way back
    return toCityId === trip.destination.id
  })
}

const loadRunInputs = async (trip: TTrip) => {
  const travellerIds = await repos.tripTravellersRepo.findTripTravellerIdsByTripId(trip.id)
  const [people, facts, candidates, user] = await Promise.all([
    repos.peopleRepo.findPeopleByIds(trip.userId, travellerIds),
    repos.profileFactsRepo.findProfileFactsForTravellers(trip.userId, travellerIds),
    loadCandidates(trip),
    repos.usersRepo.findUserById(trip.userId)
  ])

  const travellers = people.map(person => ({ person, name: person.name ?? user?.fullName ?? 'Traveller' }))

  return {
    travellers,
    facts: splitRunFacts(facts, new Map(travellers.map(t => [t.person.id, t.name]))),
    candidates
  }
}

const startOrResume = async (run: TTripRun, unverifiedFacts: TTripRun['unverifiedFacts']) => {
  if (run.status === ERunStatus.RUNNING) return { run, resume: true }

  const started = await repos.tripRunsRepo.markTripRunRunning(run.id, unverifiedFacts)

  return started ? { run: started, resume: false } : undefined
}

const runWithDeadline = async <T>(
  work: (signal: AbortSignal) => Promise<T>,
  remainingMs: number,
  controller: AbortController
) => {
  const timer = setTimeout(() => {
    controller.abort(new RunStop(RUN_FAILURE.timeout))
  }, remainingMs)
  // Don't rely on every layer honouring the signal: the race guarantees the run returns at the deadline
  const aborted = new Promise<never>((_, reject) => {
    controller.signal.addEventListener('abort', () => {
      const { reason } = controller.signal as { reason: unknown }
      reject(reason instanceof Error ? reason : new RunStop(RUN_FAILURE.error))
    }, { once: true })
  })

  try {
    return await Promise.race([work(controller.signal), aborted])
  } finally {
    clearTimeout(timer)
  }
}

const plan = async ({ tripId, runId }: IPlanTripJob) => {
  const [run, trip] = await Promise.all([
    repos.tripRunsRepo.findTripRunById(runId),
    repos.tripsRepo.findTripByIdUnscoped(tripId)
  ])
  if (!run || !trip || run.status === ERunStatus.SUCCEEDED || run.status === ERunStatus.FAILED) return

  const inputs = await loadRunInputs(trip)
  const unverified = inputs.facts.unenforceable.map(fact => ({
    id: fact.id,
    kind: fact.kind,
    value: fact.value,
    domain: fact.domain,
    subjectName: inputs.facts.subjectName(fact)
  }))
  const started = await startOrResume(run, unverified)
  if (!started) return

  const { agentRunTimeoutSeconds } = useRuntimeConfig()
  const remainingMs = started.run.startedAt!.getTime() + agentRunTimeoutSeconds * 1000 - Date.now()
  if (remainingMs <= 0) throw new RunStop(RUN_FAILURE.timeout)

  const clock = planningClock(trip)
  if (clock.now.date > trip.startDate) throw new RunStop(RUN_FAILURE.tripStarted)

  const dates = listTripDates(trip.startDate, trip.endDate)
  const destinationEntries = inputs.candidates.filter(entry => entry.cityId === trip.destination.id)
  if (destinationEntries.length === 0) throw new RunStop(RUN_FAILURE.noDestinationOptions)

  // Every candidate removed by a hard constraint is disclosed, not only the ones the agent happens to search
  const exclusions = new Map<string, TRunExclusion>(started.run.exclusions.map(e => [exclusionKey(e), e]))
  inputs.candidates
    .flatMap(entry => toExclusions(entry, findViolatedFacts(entry, inputs.facts.hard), inputs.facts))
    .forEach(exclusion => exclusions.set(exclusionKey(exclusion), exclusion))
  await repos.tripRunsRepo.updateTripRunExclusions(runId, [...exclusions.values()])

  if (dates.length > 1) {
    const stays = destinationEntries.filter(entry => entry.kind === EItemKind.STAY)
    if (stays.length === 0) throw new RunStop(RUN_FAILURE.noStayInCatalogue)
    if (stays.every(stay => findViolatedFacts(stay, inputs.facts.hard).length > 0)) throw new RunStop(RUN_FAILURE.noStayFits)
  }

  const controller = new AbortController()
  const { tools, salvageLastAttempt } = buildPlanningTools({
    trip,
    runId,
    dates,
    travellers: inputs.travellers,
    facts: inputs.facts,
    candidates: inputs.candidates,
    exclusions,
    clock,
    signal: controller.signal,
    onRejectedOut: () => { controller.abort(new RunStop(RUN_FAILURE.nothingPlannable)) }
  })

  // A deadline hit while the agent finishes its turn after save_plan still ends `ready`: the saved draft (or the
  // salvageable last attempt) is the plan. Any other stop — e.g. nothing plannable — fails as before
  const timedOut = await runWithDeadline(signal => useAgentService().runAgent({
    threadId: runId,
    message: buildPlanningMessage(trip, clock),
    systemPrompt: PLANNING_SYSTEM_PROMPT,
    tools,
    signal,
    resume: started.resume
  }), remainingMs, controller)
    .then(() => false, (error: unknown) => {
      if (error instanceof RunStop && error.reason === RUN_FAILURE.timeout) return true
      throw error
    })

  let settled = await repos.tripRunsRepo.findTripRunById(runId)
  if (!settled?.draftPlan && await salvageLastAttempt()) settled = await repos.tripRunsRepo.findTripRunById(runId)
  if (!settled?.draftPlan) throw new RunStop(timedOut ? RUN_FAILURE.timeout : RUN_FAILURE.noPlan)

  const refs = settled.draftPlan.days.flatMap(day => day.items.map(item => item.ref))
  const [entries, days] = await Promise.all([
    repos.catalogueEntriesRepo.findCatalogueEntriesByRefs(refs),
    repos.tripDaysRepo.findTripDaysByTripId(tripId)
  ])
  const entriesByRef = new Map(entries.map(e => [e.ref, e]))
  // save_plan checked every ref, but a catalogue row can still go away before the plan is written
  if (refs.some(ref => !entriesByRef.has(ref))) throw new RunStop(RUN_FAILURE.catalogueChanged)

  await finishRun({ tripId, runId, plan: settled.draftPlan, days, entriesByRef })
}

/**
 * pg-boss handler for one run. Every exit ends the run `ready` or `failed` and the job completes — a planning
 * failure is never retried. Only a crash (the process dies) leaves the job active for boot recovery.
 */
export const runPlanTripJob = async (job: IPlanTripJob) => {
  try {
    await plan(job)
  } catch (error) {
    const reason = error instanceof RunStop ? error.reason : RUN_FAILURE.error
    if (!(error instanceof RunStop)) {
      console.error('[planning] run error', job.tripId, error instanceof Error ? `${error.name}: ${error.message.slice(0, 200)}` : 'unknown')
    }
    await failRun(job.tripId, job.runId, reason)
  }
}

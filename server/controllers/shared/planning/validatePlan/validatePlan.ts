import type { IRunFacts } from '../factRules'
import type { TPlanningClock } from '../planTime'

import { buildSavedPlan } from './buildSavedPlan'
import { checkUnmetRequests } from './checkUnmetRequests'
import { correctReasons } from './correctReasons'
import { placeItems } from './placeItems'
import type { IPlanContext } from './planContext'
import { checkPlanRules } from './planRules'
import { salvagePlan } from './salvagePlan'

import type { TSavePlanInput } from '~~/server/types/agent/SavePlanInput'
import type { TCatalogueEntry } from '~~/server/types/catalogue/CatalogueEntry'
import type { TRunExclusion } from '~~/shared/schemas/trips/RunExclusionSchema'
import type { TSavedPlan } from '~~/server/types/trips/SavedPlan'
import type { TTrip } from '~~/server/types/trips/Trip'

interface IValidatePlanResult {
  errors: string[]
  plan?: TSavedPlan
  salvaged?: boolean
}

interface IValidatePlanArgs {
  input: TSavePlanInput
  trip: TTrip
  dates: string[]
  entriesByRef: Map<string, TCatalogueEntry>
  facts: IRunFacts
  removedRefs: Set<string>
  clock: TPlanningClock
  exclusions: TRunExclusion[]
  travellerNotes: string[]
  // The agent's last chance: instead of rejecting, leave out what fails and state the rest as gaps
  salvage?: boolean
}

/**
 * Code-side gate for `save_plan`: every rule the plan must hold that code can check. Returns the errors to send
 * back to the agent, and the plan with facts resolved (cited facts copied with their kind, domain and subject;
 * catalogue times applied) when it passes — or, with `salvage`, when code could repair it.
 */
export const validatePlan = ({ exclusions, salvage = false, ...args }: IValidatePlanArgs): IValidatePlanResult => {
  const ctx: IPlanContext = {
    ...args,
    firstDate: args.dates[0]!,
    lastDate: args.dates[args.dates.length - 1]!,
    gaps: [...args.input.gaps]
  }

  const placed = placeItems(ctx)
  const unmet = checkUnmetRequests(ctx)
  const issues = [...placed.issues, ...unmet.issues, ...checkPlanRules(ctx, placed.items)]
  const build = (planCtx: IPlanContext, items: typeof placed.items) => {
    const corrected = correctReasons(planCtx, unmet.kept, exclusions)

    return buildSavedPlan(corrected.ctx, items, { titles: placed.titles, exclusions, unmetRequests: corrected.unmetRequests })
  }
  if (issues.length === 0) return { errors: [], plan: build(ctx, placed.items) }

  const errors = [...new Set(issues.map(issue => issue.message))]
  const repaired = salvage ? salvagePlan(ctx, placed.items, issues) : undefined
  if (!repaired) return { errors }

  return { errors, plan: build(repaired.ctx, repaired.items), salvaged: true }
}

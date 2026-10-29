import type { IPlacedItem, IPlanContext } from './planContext'
import { isInbound, isOutbound } from './planContext'

import type { TRunExclusion } from '~~/shared/schemas/trips/RunExclusionSchema'
import type { TUnmetRequest } from '~~/shared/schemas/trips/UnmetRequestSchema'
import type { TSavedPlan } from '~~/server/types/trips/SavedPlan'
import { EGapReason } from '~~/shared/schemas/trips/GapReason'

// The outbound leg opens the trip and the way home closes it, whatever the clock says (a check-in can precede arrival)
const orderDay = (ctx: IPlanContext, items: IPlacedItem[]) => {
  const rank = (item: IPlacedItem) => isOutbound(ctx, item) ? -1 : isInbound(ctx, item) ? 1 : 0

  return items.toSorted((a, b) => rank(a) - rank(b) || a.time.localeCompare(b.time))
}

interface ISavedPlanExtras {
  titles: Map<string, string | null>
  exclusions: TRunExclusion[]
  unmetRequests: TUnmetRequest[]
}

export const buildSavedPlan = (
  ctx: IPlanContext,
  items: IPlacedItem[],
  { titles, exclusions, unmetRequests }: ISavedPlanExtras
): TSavedPlan => ({
  days: ctx.dates.map(date => ({
    date,
    title: titles.get(date) ?? null,
    items: orderDay(ctx, items.filter(item => item.date === date))
      .map(item => ({ ref: item.entry.ref, time: item.time, why: item.why, citedFacts: item.citedFacts }))
  })),
  gaps: ctx.gaps.map((gap) => {
    // Code's own gaps say the planner couldn't fit one; no rule is to blame
    if (gap.reason === EGapReason.NOT_PLANNED) return { kind: gap.kind, date: gap.date ?? null, reason: gap.reason, facts: [] }

    // A gap lists the hard constraints that removed entries of its kind, so "nothing fits" is traceable
    const removedByFact = new Map(exclusions
      .filter(exclusion => ctx.entriesByRef.get(exclusion.ref)?.kind === gap.kind)
      .map(exclusion => [exclusion.factId, {
        id: exclusion.factId,
        value: exclusion.factValue,
        kind: exclusion.factKind,
        domain: exclusion.factDomain,
        subjectName: exclusion.subjectName,
        checkedByCode: true
      }]))

    return { kind: gap.kind, date: gap.date ?? null, reason: gap.reason, facts: [...removedByFact.values()] }
  }),
  unmetRequests
})

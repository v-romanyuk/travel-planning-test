import type { IPlacedItem, IPlanContext, IPlanGap, IPlanIssue } from './planContext'
import { checkPlanRules } from './planRules'

import { EGapReason } from '~~/shared/schemas/trips/GapReason'

// Each pass only removes items or adds gaps, so it settles fast; the cap guards a check that keeps disagreeing
const MAX_PASSES = 5

const sameGap = (a: Omit<IPlanGap, 'reason'>, b: Omit<IPlanGap, 'reason'>) => a.kind === b.kind && (a.date ?? null) === (b.date ?? null)

const applyFixes = (items: IPlacedItem[], gaps: IPlanGap[], issues: IPlanIssue[]) => {
  const dropped = new Set<IPlacedItem>()
  const droppedGaps = new Set<IPlanGap>()
  const added: IPlanGap[] = []

  for (const { fix } of issues) {
    if (!fix) continue
    if ('drop' in fix) dropped.add(fix.drop)
    else if ('dropGap' in fix) droppedGaps.add(fix.dropGap)
    else if (!added.some(gap => sameGap(gap, fix.addGap))) added.push({ ...fix.addGap, reason: EGapReason.NOT_PLANNED })
  }

  return {
    items: items.filter(item => !dropped.has(item)),
    gaps: [...gaps.filter(gap => !droppedGaps.has(gap)), ...added]
  }
}

/**
 * Repairs a plan the agent couldn't get right: every item that fails a check is left out and every missing piece is
 * stated as a `not_planned` gap. It never adds or changes an item, so the result stays grounded in what the agent
 * chose. Undefined when nothing would be left to plan, or the checks don't settle.
 */
export const salvagePlan = (ctx: IPlanContext, items: IPlacedItem[], issues: IPlanIssue[]) => {
  let current = applyFixes(items, ctx.gaps, issues)

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const passCtx = { ...ctx, gaps: current.gaps }
    const remaining = checkPlanRules(passCtx, current.items)
    if (remaining.length === 0) return current.items.length > 0 ? { ctx: passCtx, items: current.items } : undefined

    current = applyFixes(current.items, current.gaps, remaining)
  }
}

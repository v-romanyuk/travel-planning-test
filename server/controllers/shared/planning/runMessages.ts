import type { TSavedPlan } from '~~/server/types/trips/SavedPlan'

// Templated so the agent's own text never reaches the conversation: no place names, prices or times (AC-21)
export const RUN_FAILURE = {
  noDestinationOptions: 'The destination has no options in the catalogue yet.',
  noStayInCatalogue: 'The catalogue has no stays at the destination.',
  noStayFits: 'No stay at the destination fits your hard constraints.',
  timeout: 'Planning took too long.',
  nothingPlannable: 'None of the options the planner picked passed our checks, so there was nothing to plan. Try again.',
  noPlan: 'The planner finished without saving a plan.',
  error: 'Something went wrong while planning.',
  notStarted: 'Planning couldn\'t start. Try again.',
  stopped: 'Planning stopped unexpectedly.',
  catalogueChanged: 'The catalogue changed while planning. Try again.',
  tripStarted: 'This trip has already started, and only trips that haven\'t begun can be planned.'
} as const

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

// `replanned`: an earlier run had produced a plan, so this one replaces it
export const buildReadyMessage = (plan: TSavedPlan, replanned: boolean) => {
  const itemCount = plan.days.reduce((sum, day) => sum + day.items.length, 0)
  const gaps = plan.gaps.length > 0
    ? ` ${plural(plan.gaps.length, 'part')} couldn't be filled — they're listed in the plan.`
    : ''

  const summary = `${plural(plan.days.length, 'day')} with ${plural(itemCount, 'planned item')}`
  const lead = replanned ? `Your plan has been re-planned: ${summary}.` : `Your plan is ready: ${summary}.`

  return `${lead}${gaps} Nothing has been booked or paid.`
}

export const buildFailedMessage = (reason: string, replanned: boolean) => replanned
  ? `I couldn't re-plan this trip. ${reason} Your previous plan is still there. Nothing has been booked or paid.`
  : `I couldn't finish this plan. ${reason} Nothing has been booked or paid.`

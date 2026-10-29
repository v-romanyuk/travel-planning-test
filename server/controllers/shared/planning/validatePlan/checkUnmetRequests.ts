import type { IPlanContext, IPlanIssue } from './planContext'

import type { TUnmetRequest } from '~~/shared/schemas/trips/UnmetRequestSchema'

const normalize = (text: string) => text.toLowerCase().replace(/["'“”‘’.,!?]/g, '').replace(/\s+/g, ' ').trim()

/**
 * Keeps the unmet requests that quote the traveller's notes, so the plan never shows words they didn't write.
 * A misquote is reported to the agent but doesn't block a salvage: the request is just left out.
 */
export const checkUnmetRequests = (ctx: IPlanContext) => {
  const notes = ctx.travellerNotes.map(normalize)
  const kept: TUnmetRequest[] = []
  const issues: IPlanIssue[] = []

  for (const unmet of ctx.input.unmetRequests) {
    const quote = normalize(unmet.request)
    if (quote && notes.some(note => note.includes(quote))) {
      kept.push({ request: unmet.request.trim(), reason: unmet.reason })
    } else {
      issues.push({ message: `Unmet request "${unmet.request}" is not in the notes; copy the traveller's words exactly.` })
    }
  }

  return { kept, issues }
}

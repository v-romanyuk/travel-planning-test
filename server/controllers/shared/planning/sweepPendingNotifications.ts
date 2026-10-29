import { onRunFinished } from './onRunFinished'

import { repos } from '~~/server/repos'

// Younger than this, an old process may still be mid-send during a deploy
const MIN_AGE_MS = 2 * 60_000
// Older than this, "your plan is ready" is noise, and outside WhatsApp's 24 h free-form window anyway
const MAX_AGE_MS = 24 * 60 * 60_000

/** Boot: sends messages a crash left `pending`, one at a time, and expires the stale ones. Never rejects. */
export const sweepPendingNotifications = async () => {
  try {
    const now = Date.now()
    const expired = await repos.tripRunsRepo.expirePendingNotifications(new Date(now - MAX_AGE_MS))
    const due = await repos.tripRunsRepo.findPendingNotificationTripRuns(new Date(now - MIN_AGE_MS))

    // Sequential on purpose: a boot after a long outage shouldn't burst Twilio or the pool
    await due.reduce((previous, run) => previous.then(() => onRunFinished(run.id)), Promise.resolve())

    if (expired > 0 || due.length > 0) console.info('[whatsapp] boot sweep', { expired, resent: due.length })
  } catch (error) {
    console.error('[whatsapp] boot sweep failed', error instanceof Error ? error.name : 'unknown')
  }
}

import { buildWhatsAppMessage } from './whatsappMessage'

import { repos } from '~~/server/repos'
import { TwilioSendError, useTwilioService } from '~~/server/services/twilio/twilio.service'
import { ENotificationStatus } from '~~/server/types/trips/NotificationStatus'
import type { TTrip } from '~~/server/types/trips/Trip'
import type { TTripRun } from '~~/server/types/trips/TripRun'
import { ERunStatus } from '~~/shared/schemas/trips/RunStatus'

// Written by the terminal update itself, so whether a message is owed is decided once, with the run
export const notificationStatusFor = (trip: TTrip | undefined) => trip?.whatsappOptIn && trip.whatsappNumber
  ? ENotificationStatus.PENDING
  : ENotificationStatus.SKIPPED

// A deploy missing NUXT_PUBLIC_APP_URL would send localhost links; Fly sets FLY_APP_NAME on every machine
const appBaseUrl = () => {
  const { appUrl } = useRuntimeConfig().public
  const flyApp = process.env.FLY_APP_NAME
  const base = flyApp && /\/\/(localhost|127\.0\.0\.1)\b/.test(appUrl) ? `https://${flyApp}.fly.dev` : appUrl

  return base.replace(/\/+$/, '')
}

const logOutcome = (run: TTripRun, status: ENotificationStatus, ref: string | null) => {
  const log = status === ENotificationStatus.FAILED ? console.warn : console.info
  log('[whatsapp] notification', { tripId: run.tripId, runId: run.id, status, ref })
}

const notify = async (runId: string) => {
  const run = await repos.tripRunsRepo.findTripRunById(runId)
  if (run?.notificationStatus !== ENotificationStatus.PENDING) return
  if (run.status !== ERunStatus.SUCCEEDED && run.status !== ERunStatus.FAILED) return

  const [trip, runs] = await Promise.all([
    repos.tripsRepo.findTripByIdUnscoped(run.tripId),
    repos.tripRunsRepo.findTripRunsByTripId(run.tripId)
  ])

  const twilio = useTwilioService()
  if (!trip?.whatsappNumber || !twilio.isConfigured()) {
    await repos.tripRunsRepo.settleTripRunNotification(run.id, ENotificationStatus.SKIPPED, null)
    if (trip?.whatsappNumber) console.info('[whatsapp] Twilio not configured, skipped', { tripId: run.tripId, runId: run.id })

    return
  }

  // Decided at send time, so a boot re-send words it the same as the original would have
  const replanned = runs.some(other => other.status === ERunStatus.SUCCEEDED && other.createdAt < run.createdAt)
  const body = buildWhatsAppMessage({
    status: run.status,
    replanned,
    startDate: trip.startDate,
    endDate: trip.endDate,
    link: `${appBaseUrl()}/trips/${trip.id}/plan`
  })

  const outcome = await twilio.sendWhatsAppMessage({ to: trip.whatsappNumber, body })
    .then(({ sid }) => ({ status: ENotificationStatus.SENT as const, ref: sid }))
    .catch((error: unknown) => ({
      status: ENotificationStatus.FAILED as const,
      ref: error instanceof TwilioSendError ? error.ref : 'network'
    }))

  // If this write fails the run stays `pending` and the next boot's sweep sends it again (the accepted duplicate)
  await repos.tripRunsRepo.settleTripRunNotification(run.id, outcome.status, outcome.ref)
  logOutcome(run, outcome.status, outcome.ref)
}

/**
 * After a run's terminal state is committed: sends the run's one WhatsApp message if it is still `pending`.
 * Never rejects and never retries — nothing here can reach the run or the trip status.
 */
export const onRunFinished = async (runId: string): Promise<void> => {
  try {
    await notify(runId)
  } catch (error) {
    console.error('[whatsapp] notification error', { runId }, error instanceof Error ? error.name : 'unknown')
  }
}

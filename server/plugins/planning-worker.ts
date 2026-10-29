import { setTimeout as sleep } from 'node:timers/promises'

import { startPlanningWorker } from '~~/server/controllers/shared/planning/startPlanningWorker'
import { useQueueService } from '~~/server/services/queue/queue.service'

const MAX_RETRY_DELAY_MS = 60_000

// The planning worker lives in the web process (one always-on machine); runs outlive the request that queued them
export default defineNitroPlugin((nitroApp) => {
  if (import.meta.prerender) return

  let closing = false

  // Without a worker the API still queues trips that would sit in `planning` forever, so a failed start keeps retrying
  const start = async () => {
    for (let attempt = 0; !closing; attempt++) {
      try {
        await startPlanningWorker()

        return
      } catch (error) {
        const delayMs = Math.min(MAX_RETRY_DELAY_MS, 2_000 * 2 ** attempt)
        console.error('[planning] worker failed to start, retrying', { attempt, delayMs }, error instanceof Error ? error.message : error)
        await sleep(delayMs)
      }
    }
  }
  void start()

  nitroApp.hooks.hook('close', async () => {
    closing = true
    await useQueueService().stop()
  })
})

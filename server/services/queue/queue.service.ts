import { PgBoss } from 'pg-boss'
import type { Job } from 'pg-boss'

export interface IPlanTripJob {
  tripId: string
  runId: string
}

const PLAN_TRIP_QUEUE = 'plan-trip'
const PLAN_TRIP_DEAD_QUEUE = 'plan-trip-dead'

// pg-boss expiry is the backstop behind our own run timeout, so it must stay above it
const EXPIRY_HEADROOM_SECONDS = 120
const MIN_EXPIRE_SECONDS = 600
// The worker refreshes it every 15s; a job whose process died stops refreshing and is failed (→ retry) within 30s
const HEARTBEAT_SECONDS = 30

let bossPromise: Promise<PgBoss> | undefined
const workingQueues = new Set<string>()

type TQueueOptions = NonNullable<Parameters<PgBoss['createQueue']>[1]>

const ensureQueue = async (boss: PgBoss, name: string, { policy, ...options }: TQueueOptions) => {
  // createQueue fails on an existing queue, and a queue's policy can't change after creation
  if (await boss.getQueue(name)) {
    await boss.updateQueue(name, options)

    return
  }
  await boss.createQueue(name, { policy, ...options })
}

const getBoss = () => {
  bossPromise ??= (async () => {
    const { agentRunTimeoutSeconds } = useRuntimeConfig()
    // Shares the Drizzle pool instead of opening its own
    const pool = useDrizzle().$client
    const boss = new PgBoss({ db: { executeSql: (text, values) => pool.query(text, values) }, schema: 'pgboss' })
    boss.on('error', (error: Error) => {
      console.error('[queue] pg-boss error', error.message)
    })
    await boss.start()

    const expireInSeconds = Math.max(MIN_EXPIRE_SECONDS, agentRunTimeoutSeconds + EXPIRY_HEADROOM_SECONDS)
    await ensureQueue(boss, PLAN_TRIP_DEAD_QUEUE, { retryLimit: 3, retryDelay: 5 })
    // `singleton` + singletonKey = trip id: at most one active job per trip, others wait.
    // retryLimit 1 = one retry after a crash, missed heartbeat or expiry, then the dead-letter queue
    await ensureQueue(boss, PLAN_TRIP_QUEUE, {
      policy: 'singleton',
      retryLimit: 1,
      expireInSeconds,
      heartbeatSeconds: HEARTBEAT_SECONDS,
      deadLetter: PLAN_TRIP_DEAD_QUEUE
    })

    return boss
  })().catch((error: unknown) => {
    bossPromise = undefined
    throw error
  })

  return bossPromise
}

// Registering twice would double the workers, so a retried boot skips the queues it already works
const workOnce = async (name: string, options: { localConcurrency?: number }, handler: (job: IPlanTripJob) => Promise<void>) => {
  if (workingQueues.has(name)) return

  const boss = await getBoss()
  await boss.work<IPlanTripJob>(name, { ...options, batchSize: 1 }, async (jobs: Job<IPlanTripJob>[]) => {
    for (const job of jobs) await handler(job.data)
  })
  workingQueues.add(name)
}

export function useQueueService () {
  async function sendPlanTripJob (job: IPlanTripJob) {
    const boss = await getBoss()

    return boss.send(PLAN_TRIP_QUEUE, job, { singletonKey: job.tripId })
  }

  async function findPlanTripJobsByRunId (runId: string) {
    const boss = await getBoss()

    return boss.findJobs<IPlanTripJob>(PLAN_TRIP_QUEUE, { data: { runId } })
  }

  function workPlanTripJobs (concurrency: number, handler: (job: IPlanTripJob) => Promise<void>) {
    return workOnce(PLAN_TRIP_QUEUE, { localConcurrency: concurrency }, handler)
  }

  function workDeadPlanTripJobs (handler: (job: IPlanTripJob) => Promise<void>) {
    return workOnce(PLAN_TRIP_DEAD_QUEUE, {}, handler)
  }

  async function stop () {
    if (!bossPromise) return
    const boss = await bossPromise
    await boss.stop({ graceful: true, timeout: 10_000 })
    bossPromise = undefined
    workingQueues.clear()
  }

  return { sendPlanTripJob, findPlanTripJobsByRunId, workPlanTripJobs, workDeadPlanTripJobs, stop }
}

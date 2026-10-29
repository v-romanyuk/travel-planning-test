import { sql } from 'drizzle-orm'

export default defineEventHandler(async () => {
  let dbConnected = false
  try {
    await useDrizzle().execute(sql`SELECT 1`)
    dbConnected = true
  } catch (error) {
    console.error('[health] db check failed', error instanceof Error ? error.message : error)
  }

  return { status: 'ok', dbConnected }
})

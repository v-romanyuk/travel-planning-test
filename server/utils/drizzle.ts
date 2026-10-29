import { drizzle } from 'drizzle-orm/node-postgres'
import type { PgDatabase } from 'drizzle-orm/pg-core'
import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from '~~/server/services/drizzle/schema'

type TSchema = typeof schema

export type TDrizzle = PgDatabase<NodePgQueryResultHKT, TSchema, ExtractTablesWithRelations<TSchema>>

type TDrizzleClient = ReturnType<typeof drizzle<TSchema>>

let cached: TDrizzleClient | undefined

export const useDrizzle = (): TDrizzleClient => {
  if (cached) return cached

  const { databaseUrl } = useRuntimeConfig()
  if (!databaseUrl) {
    throw new Error('NUXT_DATABASE_URL is not configured')
  }

  // node-postgres, not postgres.js: postgres.js pipelines queries on busy connections, and through the Supabase
  // transaction pooler those came back with each other's rows or hung; turning pipelining off there breaks `sql.begin`.
  // pg runs one query per connection, sends unnamed statements (pooler-safe) and closes idle clients after 10s.
  const pool = new Pool({ connectionString: databaseUrl })
  // An idle client dropped by the pooler emits here; without a listener Node treats it as uncaught and kills the instance.
  pool.on('error', (err) => {
    console.error('[db] idle client error', err.message)
  })

  cached = drizzle({ client: pool, casing: 'snake_case', schema })

  return cached
}

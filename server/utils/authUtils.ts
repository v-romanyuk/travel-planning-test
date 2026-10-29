import type { H3Event } from 'h3'

import { serverSupabaseClient } from '#supabase/server'

// Reads the session from the Supabase cookie. getClaims throws plain Errors (expired, undecodable) next to
// returning AuthErrors — all mean "log in again"
export const resolveAuthSub = async (event: H3Event) => {
  const client = await serverSupabaseClient(event)

  try {
    const { data, error } = await client.auth.getClaims()
    if (error) return undefined

    return data?.claims.sub
  } catch (err) {
    console.warn('[auth] token verification failed', err instanceof Error ? err.message : err)

    return undefined
  }
}

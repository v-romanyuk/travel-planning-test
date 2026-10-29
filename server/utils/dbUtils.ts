const FOREIGN_KEY_VIOLATION = '23503'

// For INSERT … RETURNING, where an empty result means the driver misbehaved, not "not found"
export const firstOrThrow = <T>(rows: T[], query: string): T => {
  const [row] = rows
  if (!row) throw new Error(`${query} returned no row`)

  return row
}

// Drizzle wraps driver errors in DrizzleQueryError; the pg error with its SQLSTATE code is the `cause`
export const isForeignKeyViolation = (error: unknown) => {
  const pgError = error instanceof Error && error.cause instanceof Error ? error.cause : error

  return (pgError as { code?: unknown } | null)?.code === FOREIGN_KEY_VIOLATION
}

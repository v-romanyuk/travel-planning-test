import { asc, eq } from 'drizzle-orm'

import { tripGapsTable } from '~~/server/services/drizzle/schema'
import type { ITripGapsRepo } from '~~/server/types/repos/ITripGapsRepo'
import { TripGapSchema } from '~~/server/types/trips/TripGap'
import type { TDrizzle } from '~~/server/utils/drizzle'

export const tripGapsRepo = (db: TDrizzle): ITripGapsRepo => ({
  async insertTripGaps (gaps) {
    if (gaps.length === 0) return []

    const rows = await db.insert(tripGapsTable).values(gaps).returning()

    return TripGapSchema.array().parse(rows)
  },

  async findTripGapsByTripId (tripId) {
    const rows = await db
      .select()
      .from(tripGapsTable)
      .where(eq(tripGapsTable.tripId, tripId))
      .orderBy(asc(tripGapsTable.date))

    return TripGapSchema.array().parse(rows)
  },

  async deleteTripGapsByTripId (tripId) {
    const rows = await db
      .delete(tripGapsTable)
      .where(eq(tripGapsTable.tripId, tripId))
      .returning({ id: tripGapsTable.id })

    return rows.length
  }
})

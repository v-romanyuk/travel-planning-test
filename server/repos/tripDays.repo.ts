import { and, asc, eq } from 'drizzle-orm'

import { tripDaysTable } from '~~/server/services/drizzle/schema'
import type { ITripDaysRepo } from '~~/server/types/repos/ITripDaysRepo'
import { TripDaySchema } from '~~/server/types/trips/TripDay'
import type { TDrizzle } from '~~/server/utils/drizzle'

export const tripDaysRepo = (db: TDrizzle): ITripDaysRepo => ({
  async insertTripDays (days) {
    if (days.length === 0) return []

    const rows = await db.insert(tripDaysTable).values(days).returning()

    return TripDaySchema.array().parse(rows)
  },

  async findTripDaysByTripId (tripId) {
    const rows = await db
      .select()
      .from(tripDaysTable)
      .where(eq(tripDaysTable.tripId, tripId))
      .orderBy(asc(tripDaysTable.position))

    return TripDaySchema.array().parse(rows)
  },

  async findTripDayById (tripId, dayId) {
    const [row] = await db
      .select()
      .from(tripDaysTable)
      .where(and(eq(tripDaysTable.tripId, tripId), eq(tripDaysTable.id, dayId)))
      .limit(1)

    return row ? TripDaySchema.parse(row) : undefined
  },

  async updateTripDay (tripId, dayId, update) {
    if (Object.keys(update).length === 0) return this.findTripDayById(tripId, dayId)

    const [row] = await db
      .update(tripDaysTable)
      .set(update)
      .where(and(eq(tripDaysTable.tripId, tripId), eq(tripDaysTable.id, dayId)))
      .returning()

    return row ? TripDaySchema.parse(row) : undefined
  },

  async setPlannerDayTitle (dayId, title) {
    await db
      .update(tripDaysTable)
      .set({ title })
      .where(and(eq(tripDaysTable.id, dayId), eq(tripDaysTable.titleSetByTraveller, false)))
  }
})

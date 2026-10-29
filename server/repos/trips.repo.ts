import { and, desc, eq, ne, sql } from 'drizzle-orm'

import { tripsTable } from '~~/server/services/drizzle/schema'
import type { ITripsRepo } from '~~/server/types/repos/ITripsRepo'
import { TripSchema } from '~~/server/types/trips/Trip'
import { firstOrThrow } from '~~/server/utils/dbUtils'
import type { TDrizzle } from '~~/server/utils/drizzle'
import { ETripStatus } from '~~/shared/schemas/trips/TripStatus'

export const tripsRepo = (db: TDrizzle): ITripsRepo => ({
  async insertTrip (input) {
    const rows = await db.insert(tripsTable).values(input).returning()

    return TripSchema.parse(firstOrThrow(rows, 'insertTrip'))
  },

  async findTripById (userId, tripId) {
    const [row] = await db
      .select()
      .from(tripsTable)
      .where(and(eq(tripsTable.userId, userId), eq(tripsTable.id, tripId)))
      .limit(1)

    return row ? TripSchema.parse(row) : undefined
  },

  async findTripByIdForUpdate (userId, tripId) {
    const [row] = await db
      .select()
      .from(tripsTable)
      .where(and(eq(tripsTable.userId, userId), eq(tripsTable.id, tripId)))
      .limit(1)
      .for('update')

    return row ? TripSchema.parse(row) : undefined
  },

  async findTripsByUserId (userId) {
    const rows = await db
      .select()
      .from(tripsTable)
      .where(eq(tripsTable.userId, userId))
      .orderBy(desc(tripsTable.createdAt), desc(tripsTable.id))

    return TripSchema.array().parse(rows)
  },

  async findTripByIdUnscoped (tripId) {
    const [row] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId)).limit(1)

    return row ? TripSchema.parse(row) : undefined
  },

  async markTripPlanning (userId, tripId) {
    const [row] = await db
      .update(tripsTable)
      .set({ status: ETripStatus.PLANNING, failureReason: null, updatedAt: sql`now()` })
      .where(and(
        eq(tripsTable.userId, userId),
        eq(tripsTable.id, tripId),
        ne(tripsTable.status, ETripStatus.PLANNING)
      ))
      .returning()

    return row ? TripSchema.parse(row) : undefined
  },

  async updateTripStatus (tripId, status, failureReason) {
    const [row] = await db
      .update(tripsTable)
      .set({ status, failureReason, updatedAt: sql`now()` })
      .where(eq(tripsTable.id, tripId))
      .returning()

    return row ? TripSchema.parse(row) : undefined
  }
})

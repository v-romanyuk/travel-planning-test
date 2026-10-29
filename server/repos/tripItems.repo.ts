import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm'

import { tripItemsTable } from '~~/server/services/drizzle/schema'
import type { ITripItemsRepo } from '~~/server/types/repos/ITripItemsRepo'
import { TripItemSchema } from '~~/server/types/trips/TripItem'
import type { TDrizzle } from '~~/server/utils/drizzle'

export const tripItemsRepo = (db: TDrizzle): ITripItemsRepo => ({
  async insertTripItems (items) {
    if (items.length === 0) return []

    const rows = await db.insert(tripItemsTable).values(items).returning()

    return TripItemSchema.array().parse(rows)
  },

  async findTripItemsByTripId (tripId) {
    const rows = await db
      .select()
      .from(tripItemsTable)
      .where(eq(tripItemsTable.tripId, tripId))
      .orderBy(asc(tripItemsTable.position))

    return TripItemSchema.array().parse(rows)
  },

  async deleteLiveTripItemsByTripId (tripId) {
    const rows = await db
      .delete(tripItemsTable)
      .where(and(eq(tripItemsTable.tripId, tripId), isNull(tripItemsTable.removedAt)))
      .returning({ id: tripItemsTable.id })

    return rows.length
  },

  async findTripItemsByDayIdAndIds (dayId, itemIds) {
    if (itemIds.length === 0) return []

    const rows = await db
      .select()
      .from(tripItemsTable)
      .where(and(eq(tripItemsTable.dayId, dayId), inArray(tripItemsTable.id, itemIds)))

    return TripItemSchema.array().parse(rows)
  },

  async markTripItemsRemoved (dayId, itemIds) {
    if (itemIds.length === 0) return 0

    const rows = await db
      .update(tripItemsTable)
      .set({ removedAt: sql`now()` })
      .where(and(eq(tripItemsTable.dayId, dayId), inArray(tripItemsTable.id, itemIds), isNull(tripItemsTable.removedAt)))
      .returning({ id: tripItemsTable.id })

    return rows.length
  },

  async updateTripItemNote (dayId, itemId, note) {
    const [row] = await db
      .update(tripItemsTable)
      .set({ note })
      .where(and(eq(tripItemsTable.dayId, dayId), eq(tripItemsTable.id, itemId)))
      .returning()

    return row ? TripItemSchema.parse(row) : undefined
  }
})

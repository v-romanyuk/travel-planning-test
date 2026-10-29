import { asc, eq } from 'drizzle-orm'

import { tripMessagesTable } from '~~/server/services/drizzle/schema'
import type { ITripMessagesRepo } from '~~/server/types/repos/ITripMessagesRepo'
import { TripMessageSchema } from '~~/server/types/trips/TripMessage'
import type { TDrizzle } from '~~/server/utils/drizzle'

export const tripMessagesRepo = (db: TDrizzle): ITripMessagesRepo => ({
  async insertTripMessages (messages) {
    if (messages.length === 0) return []

    const rows = await db.insert(tripMessagesTable).values(messages).returning()

    return TripMessageSchema.array().parse(rows)
  },

  async findTripMessagesByTripId (tripId) {
    const rows = await db
      .select()
      .from(tripMessagesTable)
      .where(eq(tripMessagesTable.tripId, tripId))
      .orderBy(asc(tripMessagesTable.createdAt), asc(tripMessagesTable.seq))

    return TripMessageSchema.array().parse(rows)
  }
})

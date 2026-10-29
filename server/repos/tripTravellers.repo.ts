import { count, eq } from 'drizzle-orm'

import { tripTravellersTable } from '~~/server/services/drizzle/schema'
import type { ITripTravellersRepo } from '~~/server/types/repos/ITripTravellersRepo'
import type { TDrizzle } from '~~/server/utils/drizzle'

export const tripTravellersRepo = (db: TDrizzle): ITripTravellersRepo => ({
  async insertTripTravellers (tripId, personIds) {
    if (personIds.length === 0) return

    await db.insert(tripTravellersTable).values(personIds.map(personId => ({ tripId, personId })))
  },

  async findTripTravellerIdsByTripId (tripId) {
    const rows = await db
      .select({ personId: tripTravellersTable.personId })
      .from(tripTravellersTable)
      .where(eq(tripTravellersTable.tripId, tripId))

    return rows.map(row => row.personId)
  },

  async countTripTravellersByPersonId (personId) {
    const [row] = await db
      .select({ value: count() })
      .from(tripTravellersTable)
      .where(eq(tripTravellersTable.personId, personId))

    return row?.value ?? 0
  }
})

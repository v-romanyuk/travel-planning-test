import { and, asc, eq, getTableColumns, inArray } from 'drizzle-orm'

import { peopleTable, tripTravellersTable } from '~~/server/services/drizzle/schema'
import { PersonSchema } from '~~/server/types/knowledge-graph/Person'
import type { IPeopleRepo } from '~~/server/types/repos/IPeopleRepo'
import { firstOrThrow } from '~~/server/utils/dbUtils'
import type { TDrizzle } from '~~/server/utils/drizzle'
import { EPersonRole } from '~~/shared/schemas/knowledge-graph/PersonRole'

export const peopleRepo = (db: TDrizzle): IPeopleRepo => ({
  async insertTraveller (userId) {
    const rows = await db.insert(peopleTable).values({ userId, role: EPersonRole.TRAVELLER }).returning()

    return PersonSchema.parse(firstOrThrow(rows, 'insertTraveller'))
  },

  async findTravellerByUserId (userId) {
    const [row] = await db
      .select()
      .from(peopleTable)
      .where(and(eq(peopleTable.userId, userId), eq(peopleTable.role, EPersonRole.TRAVELLER)))
      .limit(1)

    return row ? PersonSchema.parse(row) : undefined
  },

  async findPeopleByUserId (userId) {
    const rows = await db
      .select()
      .from(peopleTable)
      .where(eq(peopleTable.userId, userId))
      .orderBy(asc(peopleTable.createdAt))

    return PersonSchema.array().parse(rows)
  },

  async findPeopleByIds (userId, personIds) {
    if (personIds.length === 0) return []

    const rows = await db
      .select()
      .from(peopleTable)
      .where(and(eq(peopleTable.userId, userId), inArray(peopleTable.id, personIds)))

    return PersonSchema.array().parse(rows)
  },

  async findPeopleByTripId (userId, tripId) {
    const rows = await db
      .select(getTableColumns(peopleTable))
      .from(peopleTable)
      .innerJoin(tripTravellersTable, eq(tripTravellersTable.personId, peopleTable.id))
      .where(and(eq(peopleTable.userId, userId), eq(tripTravellersTable.tripId, tripId)))

    return PersonSchema.array().parse(rows)
  },

  async findPersonById (userId, personId) {
    const [row] = await db
      .select()
      .from(peopleTable)
      .where(and(eq(peopleTable.userId, userId), eq(peopleTable.id, personId)))
      .limit(1)

    return row ? PersonSchema.parse(row) : undefined
  },

  async insertCompanion (userId, name) {
    const rows = await db.insert(peopleTable).values({ userId, role: EPersonRole.COMPANION, name }).returning()

    return PersonSchema.parse(firstOrThrow(rows, 'insertCompanion'))
  },

  async deleteCompanion (userId, personId) {
    const rows = await db
      .delete(peopleTable)
      .where(and(
        eq(peopleTable.userId, userId),
        eq(peopleTable.id, personId),
        eq(peopleTable.role, EPersonRole.COMPANION)
      ))
      .returning({ id: peopleTable.id })

    return rows.length
  }
})

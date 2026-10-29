import { and, asc, eq, inArray, isNull, or } from 'drizzle-orm'

import { profileFactsTable } from '~~/server/services/drizzle/schema'
import { ProfileFactSchema } from '~~/server/types/knowledge-graph/ProfileFact'
import type { IProfileFactsRepo } from '~~/server/types/repos/IProfileFactsRepo'
import { firstOrThrow } from '~~/server/utils/dbUtils'
import type { TDrizzle } from '~~/server/utils/drizzle'

export const profileFactsRepo = (db: TDrizzle): IProfileFactsRepo => ({
  async findProfileFactsByUserId (userId) {
    const rows = await db
      .select()
      .from(profileFactsTable)
      .where(eq(profileFactsTable.userId, userId))
      .orderBy(asc(profileFactsTable.createdAt))

    return ProfileFactSchema.array().parse(rows)
  },

  async findProfileFactsForTravellers (userId, personIds) {
    const subject = personIds.length > 0
      ? or(isNull(profileFactsTable.subjectPersonId), inArray(profileFactsTable.subjectPersonId, personIds))
      : isNull(profileFactsTable.subjectPersonId)

    const rows = await db
      .select()
      .from(profileFactsTable)
      .where(and(eq(profileFactsTable.userId, userId), subject))
      .orderBy(asc(profileFactsTable.createdAt))

    return ProfileFactSchema.array().parse(rows)
  },

  async insertProfileFact (input) {
    const rows = await db.insert(profileFactsTable).values(input).returning()

    return ProfileFactSchema.parse(firstOrThrow(rows, 'insertProfileFact'))
  },

  async deleteProfileFact (userId, factId) {
    const rows = await db
      .delete(profileFactsTable)
      .where(and(eq(profileFactsTable.userId, userId), eq(profileFactsTable.id, factId)))
      .returning({ id: profileFactsTable.id })

    return rows.length
  }
})

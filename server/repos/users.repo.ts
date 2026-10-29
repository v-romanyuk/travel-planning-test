import { eq } from 'drizzle-orm'

import { usersTable } from '~~/server/services/drizzle/schema'
import type { IUsersRepo } from '~~/server/types/repos/IUsersRepo'
import { UserSchema } from '~~/server/types/user/User'
import { firstOrThrow } from '~~/server/utils/dbUtils'
import type { TDrizzle } from '~~/server/utils/drizzle'

export const usersRepo = (db: TDrizzle): IUsersRepo => ({
  async findUserById (userId) {
    const [row] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1)

    return row ? UserSchema.parse(row) : undefined
  },

  async findUserBySub (subId) {
    const [row] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.subId, subId))
      .limit(1)

    return row ? UserSchema.parse(row) : undefined
  },

  async insertUser (input) {
    const rows = await db.insert(usersTable).values(input).returning()

    return UserSchema.parse(firstOrThrow(rows, 'insertUser'))
  },

  async updateUserHomeCity (userId, homeCity) {
    const rows = await db
      .update(usersTable)
      .set({ homeCity })
      .where(eq(usersTable.id, userId))
      .returning()

    return UserSchema.parse(firstOrThrow(rows, 'updateUserHomeCity'))
  }
})

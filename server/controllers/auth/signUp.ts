import type { H3Event } from 'h3'

import { buildRepos } from '~~/server/repos'
import { supabaseAuthAdminService } from '~~/server/services/supabase-auth-admin/supabase-auth-admin.service'
import type { TSignUpReq } from '~~/shared/schemas/auth/SignUpReqSchema'

// Two systems, no shared transaction: create the auth user first, then our row; undo the auth user if the row fails
export const signUp = async (event: H3Event, { password, ...profile }: TSignUpReq) => {
  const authAdmin = supabaseAuthAdminService(event)
  const { id: subId } = await authAdmin.createUser({ email: profile.email, password })

  try {
    // The traveller's person row is what facts and trips reference, so it is born with the user
    return await useDrizzle().transaction(async (tx) => {
      const txRepos = buildRepos(tx)
      const user = await txRepos.usersRepo.insertUser({ subId, ...profile })
      await txRepos.peopleRepo.insertTraveller(user.id)

      return user
    })
  } catch (error) {
    await authAdmin.deleteUser(subId).catch((cleanupError: unknown) => {
      console.error('[auth] orphaned auth user after failed signup', subId, cleanupError instanceof Error ? cleanupError.message : cleanupError)
    })

    throw error
  }
}

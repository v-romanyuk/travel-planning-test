import { serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'

import { createUserError } from '~~/server/utils/errorUtils'

interface ICreateAuthUserInput {
  email: string
  password: string
}

export const supabaseAuthAdminService = (event: H3Event) => {
  const client = serverSupabaseServiceRole(event)

  return {
    // Created already confirmed: the PoC has no email confirmation step
    async createUser (input: ICreateAuthUserInput) {
      const { data, error } = await client.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true
      })

      if (error?.code === 'email_exists') {
        throw createUserError({ statusCode: 409, message: 'An account with this email already exists' })
      }
      if (error?.code === 'weak_password') {
        throw createUserError({ statusCode: 422, message: error.message })
      }
      if (error || !data.user) {
        throw createError({ statusCode: 502, statusMessage: error?.message ?? 'Failed to create auth user' })
      }

      return { id: data.user.id }
    },

    async deleteUser (subId: string) {
      const { error } = await client.auth.admin.deleteUser(subId)
      if (error) {
        throw createError({ statusCode: 502, statusMessage: error.message })
      }
    }
  }
}

import { isPublicRoute } from '~~/server/constants/publicRoutes'
import { repos } from '~~/server/repos'
import { resolveAuthSub } from '~~/server/utils/authUtils'

const unauthorized = () => createError({ statusCode: 401, statusMessage: 'Unauthorized' })

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api') || isPublicRoute(event.path)) return

  const sub = await resolveAuthSub(event)
  if (!sub) throw unauthorized()

  // An auth user without our row (signup cleanup failed) is treated as signed out
  const user = await repos.usersRepo.findUserBySub(sub)
  if (!user) throw unauthorized()

  event.context.user = user
})

import { repos } from '~~/server/repos'
import { createUserError } from '~~/server/utils/errorUtils'

// Finished plans keep a copy of every cited fact ({ id, value }), so deleting one never breaks a trip
export const deleteFact = async (userId: string, factId: string) => {
  const deleted = await repos.profileFactsRepo.deleteProfileFact(userId, factId)
  if (deleted === 0) throw createUserError({ statusCode: 404, message: 'This preference wasn\'t found.' })
}

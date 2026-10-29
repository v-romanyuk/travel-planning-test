import { compileFactRule } from './compileFactRule/compileFactRule'

import { repos } from '~~/server/repos'
import { createUserError } from '~~/server/utils/errorUtils'
import type { TCreateFactReq } from '~~/shared/schemas/knowledge-graph/CreateFactReqSchema'

// The model call runs before the single insert: a failed rule step writes nothing
export const createFact = async (userId: string, req: TCreateFactReq) => {
  if (req.subjectPersonId) {
    const person = await repos.peopleRepo.findPersonById(userId, req.subjectPersonId)
    if (!person) throw createUserError({ statusCode: 404, message: 'This person wasn\'t found.' })
  }

  const compiled = await compileFactRule(req)

  return repos.profileFactsRepo.insertProfileFact({ userId, ...req, ...compiled })
}

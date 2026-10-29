import { repos } from '~~/server/repos'
import type { TCreatePersonReq } from '~~/shared/schemas/knowledge-graph/CreatePersonReqSchema'

export const createPerson = async (userId: string, { name }: TCreatePersonReq) => {
  const person = await repos.peopleRepo.insertCompanion(userId, name)

  return { id: person.id, name, role: person.role }
}

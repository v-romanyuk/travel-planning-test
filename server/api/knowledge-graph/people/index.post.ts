import { createPerson } from '~~/server/controllers/knowledge-graph/createPerson'
import { CreatePersonReqSchema } from '~~/shared/schemas/knowledge-graph/CreatePersonReqSchema'
import { PersonResSchema } from '~~/shared/schemas/knowledge-graph/PersonResSchema'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, b => CreatePersonReqSchema.parse(b))
  const person = await createPerson(event.context.user!.id, body)

  setResponseStatus(event, 201)

  return PersonResSchema.parse(person)
})

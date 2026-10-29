import { createFact } from '~~/server/controllers/knowledge-graph/createFact'
import { CreateFactReqSchema } from '~~/shared/schemas/knowledge-graph/CreateFactReqSchema'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, b => CreateFactReqSchema.parse(b))
  await createFact(event.context.user!.id, body)

  setResponseStatus(event, 204)

  return null
})

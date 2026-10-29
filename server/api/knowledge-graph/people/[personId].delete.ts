import { deletePerson } from '~~/server/controllers/knowledge-graph/deletePerson'
import { PersonParamsReqSchema } from '~~/shared/schemas/knowledge-graph/PersonParamsReqSchema'

export default defineEventHandler(async (event) => {
  const { personId } = await getValidatedRouterParams(event, p => PersonParamsReqSchema.parse(p))
  await deletePerson(event.context.user!.id, personId)

  setResponseStatus(event, 204)

  return null
})

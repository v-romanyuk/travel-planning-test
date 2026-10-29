import { deleteFact } from '~~/server/controllers/knowledge-graph/deleteFact'
import { FactParamsReqSchema } from '~~/shared/schemas/knowledge-graph/FactParamsReqSchema'

export default defineEventHandler(async (event) => {
  const { factId } = await getValidatedRouterParams(event, p => FactParamsReqSchema.parse(p))
  await deleteFact(event.context.user!.id, factId)

  setResponseStatus(event, 204)

  return null
})

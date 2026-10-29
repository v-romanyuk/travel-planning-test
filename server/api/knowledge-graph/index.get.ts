import { getKnowledgeGraph } from '~~/server/controllers/knowledge-graph/getKnowledgeGraph'
import { KnowledgeGraphResSchema } from '~~/shared/schemas/knowledge-graph/KnowledgeGraphResSchema'

export default defineEventHandler(async (event) => {
  const graph = await getKnowledgeGraph(event.context.user!)

  return KnowledgeGraphResSchema.parse(graph)
})

import type { TInsertProfileFact } from '~~/server/types/knowledge-graph/InsertProfileFact'
import type { TProfileFact } from '~~/server/types/knowledge-graph/ProfileFact'

export interface IProfileFactsRepo {
  findProfileFactsByUserId: (userId: string) => Promise<TProfileFact[]>
  // Party facts plus facts whose subject is one of `personIds`
  findProfileFactsForTravellers: (userId: string, personIds: string[]) => Promise<TProfileFact[]>
  insertProfileFact: (input: TInsertProfileFact) => Promise<TProfileFact>
  deleteProfileFact: (userId: string, factId: string) => Promise<number>
}

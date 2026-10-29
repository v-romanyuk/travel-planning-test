import type { TPerson } from '~~/server/types/knowledge-graph/Person'

export interface IPeopleRepo {
  insertTraveller: (userId: string) => Promise<TPerson>
  findTravellerByUserId: (userId: string) => Promise<TPerson | undefined>
  findPeopleByUserId: (userId: string) => Promise<TPerson[]>
  findPeopleByIds: (userId: string, personIds: string[]) => Promise<TPerson[]>
  findPeopleByTripId: (userId: string, tripId: string) => Promise<TPerson[]>
  findPersonById: (userId: string, personId: string) => Promise<TPerson | undefined>
  insertCompanion: (userId: string, name: string) => Promise<TPerson>
  deleteCompanion: (userId: string, personId: string) => Promise<number>
}

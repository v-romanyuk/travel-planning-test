import type { TTripMessage } from '~~/server/types/trips/TripMessage'

export interface ITripMessagesRepo {
  insertTripMessages: (messages: Pick<TTripMessage, 'tripId' | 'author' | 'kind' | 'body'>[]) => Promise<TTripMessage[]>
  findTripMessagesByTripId: (tripId: string) => Promise<TTripMessage[]>
}

import type { TTripGap } from '~~/server/types/trips/TripGap'

export interface ITripGapsRepo {
  insertTripGaps: (gaps: Omit<TTripGap, 'id'>[]) => Promise<TTripGap[]>
  findTripGapsByTripId: (tripId: string) => Promise<TTripGap[]>
  deleteTripGapsByTripId: (tripId: string) => Promise<number>
}

import type { TTrip } from '~~/server/types/trips/Trip'
import type { ETripStatus } from '~~/shared/schemas/trips/TripStatus'

export type TInsertTrip = Pick<TTrip, 'userId' | 'origin' | 'destination' | 'startDate' | 'endDate' | 'notes' | 'timeZone' | 'status' | 'whatsappNumber' | 'whatsappOptIn'>

export interface ITripsRepo {
  insertTrip: (input: TInsertTrip) => Promise<TTrip>
  findTripById: (userId: string, tripId: string) => Promise<TTrip | undefined>
  // Row-locks the trip until the tx ends, so a re-plan can't start between a status check and the writes
  findTripByIdForUpdate: (userId: string, tripId: string) => Promise<TTrip | undefined>
  // Newest first
  findTripsByUserId: (userId: string) => Promise<TTrip[]>
  // Worker side: the run has no session, the trip id comes from our own job
  findTripByIdUnscoped: (tripId: string) => Promise<TTrip | undefined>
  // Atomic guard against a second parallel run: only flips a trip that isn't already planning
  markTripPlanning: (userId: string, tripId: string) => Promise<TTrip | undefined>
  updateTripStatus: (tripId: string, status: ETripStatus, failureReason: string | null) => Promise<TTrip | undefined>
}

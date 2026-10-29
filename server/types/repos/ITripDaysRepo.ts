import type { TTripDay } from '~~/server/types/trips/TripDay'

export type TTripDayUpdate = Partial<Pick<TTripDay, 'title' | 'note' | 'titleSetByTraveller'>>

export interface ITripDaysRepo {
  insertTripDays: (days: Pick<TTripDay, 'tripId' | 'position' | 'date'>[]) => Promise<TTripDay[]>
  findTripDaysByTripId: (tripId: string) => Promise<TTripDay[]>
  findTripDayById: (tripId: string, dayId: string) => Promise<TTripDay | undefined>
  updateTripDay: (tripId: string, dayId: string, update: TTripDayUpdate) => Promise<TTripDay | undefined>
  // Writes the planner's title (null clears it); a day whose title the traveller set is never touched
  setPlannerDayTitle: (dayId: string, title: string | null) => Promise<void>
}

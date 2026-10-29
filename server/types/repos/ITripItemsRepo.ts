import type { TInsertTripItem } from '~~/server/types/trips/InsertTripItem'
import type { TTripItem } from '~~/server/types/trips/TripItem'

export interface ITripItemsRepo {
  insertTripItems: (items: TInsertTripItem[]) => Promise<TTripItem[]>
  // Includes removed items
  findTripItemsByTripId: (tripId: string) => Promise<TTripItem[]>
  deleteLiveTripItemsByTripId: (tripId: string) => Promise<number>
  // Includes removed items
  findTripItemsByDayIdAndIds: (dayId: string, itemIds: string[]) => Promise<TTripItem[]>
  // Already removed items keep their original removedAt
  markTripItemsRemoved: (dayId: string, itemIds: string[]) => Promise<number>
  updateTripItemNote: (dayId: string, itemId: string, note: string | null) => Promise<TTripItem | undefined>
}

import type { TTripItem } from '~~/server/types/trips/TripItem'

export type TInsertTripItem = Omit<TTripItem, 'id' | 'removedAt' | 'note'> & Partial<Pick<TTripItem, 'note'>>

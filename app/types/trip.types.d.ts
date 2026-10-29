type TTripDayRes = import('~~/shared/schemas/trips/TripResSchema').TTripRes['days'][number]
type TTripItemRes = TTripDayRes['items'][number]
type TTripGapRes = import('~~/shared/schemas/trips/TripResSchema').TTripRes['gaps'][number]

// "Edit day" state: the inputs as typed, compared with the day to find what changed
interface IDayDraft {
  dayId: string
  title: string
  note: string
  removedItemIds: string[]
  itemNotes: Record<string, string>
}

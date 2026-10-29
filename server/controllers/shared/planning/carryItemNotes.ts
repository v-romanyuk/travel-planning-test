import type { TInsertTripItem } from '~~/server/types/trips/InsertTripItem'
import type { TTripDay } from '~~/server/types/trips/TripDay'
import type { TTripItem } from '~~/server/types/trips/TripItem'

/**
 * A traveller's item note is never lost across a re-plan: it follows the first new item (by day, then position) for
 * the same catalogue entry, or is appended to its old day's note as "Note on <name>: <note>".
 */
export const carryItemNotes = (previous: TTripItem[], items: TInsertTripItem[], days: TTripDay[]) => {
  const dayById = new Map(days.map(day => [day.id, day]))
  const order = (a: Pick<TTripItem, 'dayId' | 'position'>, b: Pick<TTripItem, 'dayId' | 'position'>) => (dayById.get(a.dayId)?.position ?? 0) - (dayById.get(b.dayId)?.position ?? 0) || a.position - b.position

  const next = items.map(item => ({ ...item }))
  const candidates = next.toSorted(order)
  const taken = new Set<TInsertTripItem>()
  const dayNotes = new Map<string, string>()

  // Removed items keep their own note; they aren't replaced by a run
  const noted = previous.filter(item => item.removedAt === null && item.note).toSorted(order)
  for (const old of noted) {
    const match = candidates.find(item => item.catalogueEntryId === old.catalogueEntryId && !taken.has(item))
    if (match) {
      match.note = old.note
      taken.add(match)
      continue
    }

    const current = dayNotes.get(old.dayId) ?? dayById.get(old.dayId)?.note
    const line = `Note on ${old.name}: ${old.note}`
    dayNotes.set(old.dayId, current ? `${current}\n${line}` : line)
  }

  return { items: next, dayNotes }
}

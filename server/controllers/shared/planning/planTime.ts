import dayjs from 'dayjs'

import type { TTrip } from '~~/server/types/trips/Trip'
import { localNow } from '~~/shared/utils/timeZone'

// Any fixed day works: only the clock part of these values matters
const CLOCK_DAY = '2000-01-01'

// Capped at 23:59 — an item's end time never spills into the next day
export const addMinutes = (hhmm: string, minutes: number) => {
  const start = dayjs(`${CLOCK_DAY}T${hhmm}`)
  const end = start.add(minutes, 'minute')

  return end.isSame(start, 'day') ? end.format('HH:mm') : '23:59'
}

// Same-day span between two HH:mm clock times
export const minutesBetween = (from: string, to: string) => dayjs(`${CLOCK_DAY}T${to}`).diff(`${CLOCK_DAY}T${from}`, 'minute')

// Closing after midnight (e.g. 18:00–01:00) wraps
export const isWithinHours = (time: string, opensAt: string, closesAt: string) => opensAt <= closesAt
  ? time >= opensAt && time < closesAt
  : time >= opensAt || time < closesAt

export const listTripDates = (startDate: string, endDate: string) => {
  const end = dayjs(endDate)
  const dates: string[] = []
  for (let day = dayjs(startDate); !day.isAfter(end, 'day'); day = day.add(1, 'day')) {
    dates.push(day.format('YYYY-MM-DD'))
  }

  return dates
}

// Leaves time to get to the first item: a run takes minutes, the traveller needs more
const EARLIEST_START_BUFFER_MIN = 60

/**
 * "Now" where the traveller is, and on the trip's first day when that is today, the earliest time anything may start
 * (an hour ahead, rounded up to the quarter hour). Catalogue times are local; the traveller is taken to be in their
 * request's time zone.
 */
export const planningClock = (trip: Pick<TTrip, 'timeZone' | 'startDate'>) => {
  const now = localNow(trip.timeZone)
  if (now.date !== trip.startDate) return { now, notBefore: null }

  const [hours, minutes] = addMinutes(now.time, EARLIEST_START_BUFFER_MIN).split(':').map(Number)
  const rounded = Math.ceil((hours! * 60 + minutes!) / 15) * 15
  const time = rounded >= 24 * 60 ? '23:59' : `${String(Math.floor(rounded / 60)).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}`

  return { now, notBefore: { date: trip.startDate, time } }
}

export type TPlanningClock = ReturnType<typeof planningClock>

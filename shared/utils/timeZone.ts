export const isValidTimeZone = (timeZone: string) => {
  try {
    return Boolean(new Intl.DateTimeFormat('en-US', { timeZone }).resolvedOptions().timeZone)
  } catch {
    return false
  }
}

/** Wall-clock date and time in `timeZone`: `{ date: 'YYYY-MM-DD', time: 'HH:mm' }` */
export const localNow = (timeZone: string, at = new Date()) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(at).map(part => [part.type, part.value]))

  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
}

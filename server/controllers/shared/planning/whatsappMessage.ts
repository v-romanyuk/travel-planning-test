import dayjs from 'dayjs'

import { ERunStatus } from '~~/shared/schemas/trips/RunStatus'

interface IWhatsAppMessageArgs {
  status: ERunStatus.SUCCEEDED | ERunStatus.FAILED
  replanned: boolean
  startDate: string
  endDate: string
  link: string
}

// "12 Nov", "12–15 Nov", "28 Nov – 2 Dec", "30 Dec 2026 – 2 Jan 2027"; the year only when the trip spans two
export const formatTripDates = (startDate: string, endDate: string) => {
  const start = dayjs(startDate)
  const end = dayjs(endDate)

  if (!start.isSame(end, 'year')) return `${start.format('D MMM YYYY')} – ${end.format('D MMM YYYY')}`
  if (start.isSame(end, 'day')) return start.format('D MMM')
  if (start.isSame(end, 'month')) return `${start.format('D')}–${end.format('D MMM')}`

  return `${start.format('D MMM')} – ${end.format('D MMM')}`
}

// Dates and the link only: no destination, item, price or time ever goes over WhatsApp
export const buildWhatsAppMessage = ({ status, replanned, startDate, endDate, link }: IWhatsAppMessageArgs) => {
  const dates = formatTripDates(startDate, endDate)

  if (status === ERunStatus.SUCCEEDED) {
    return replanned
      ? `Your updated trip plan for ${dates} is ready: ${link}`
      : `Your trip plan for ${dates} is ready: ${link}`
  }

  return replanned
    ? `We couldn't update your trip plan for ${dates} — your previous plan is still there: ${link}`
    : `We couldn't plan your trip for ${dates}. Details: ${link}`
}

import dayjs from 'dayjs'

import { EPriceUnit } from '~~/shared/schemas/catalogue/PriceUnit'
import { EPreferenceDomain } from '~~/shared/schemas/knowledge-graph/PreferenceDomain'
import { EGapReason } from '~~/shared/schemas/trips/GapReason'
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'
import { EUnmetReason } from '~~/shared/schemas/trips/UnmetReason'

export const ITEM_KIND_LABELS: Record<EItemKind, string> = {
  [EItemKind.STAY]: 'Stay',
  [EItemKind.PLACE]: 'Place',
  [EItemKind.TRANSPORT]: 'Transport'
}

export const DOMAIN_LABELS: Record<EPreferenceDomain, string> = {
  [EPreferenceDomain.STAY]: 'stay',
  [EPreferenceDomain.FOOD]: 'food',
  [EPreferenceDomain.TRANSPORT]: 'transport'
}

const PRICE_UNIT_LABELS: Record<string, string> = {
  [EPriceUnit.PER_NIGHT]: 'per night',
  [EPriceUnit.PER_PERSON]: 'per person',
  [EPriceUnit.PER_ADULT]: 'per adult'
}

/** "12–15 Nov 2026", "28 Nov – 2 Dec 2026", "30 Dec 2026 – 2 Jan 2027" */
export const formatTripDates = (startDate: string, endDate: string) => {
  const start = dayjs(startDate)
  const end = dayjs(endDate)
  if (start.isSame(end, 'day')) return end.format('D MMM YYYY')
  if (start.isSame(end, 'month')) return `${start.format('D')}–${end.format('D MMM YYYY')}`
  if (start.isSame(end, 'year')) return `${start.format('D MMM')} – ${end.format('D MMM YYYY')}`

  return `${start.format('D MMM YYYY')} – ${end.format('D MMM YYYY')}`
}

/**
 * "Why chosen" without the planner's "No stored preference applied" lead-in: an item that cites no preference shows
 * only its plain reason (or nothing).
 */
export const formatWhy = (why: string) => {
  const reason = why.replace(/^\s*no stored preference applied\s*[.;:,—–-]*\s*/i, '')

  return reason.charAt(0).toUpperCase() + reason.slice(1)
}

export const formatDayDate = (date: string) => dayjs(date).format('ddd D MMM')

/** "Olena", "Olena and Taras", "Olena, Taras and Ivan" */
export const formatNames = (names: string[]) => names.length <= 1
  ? names.join('')
  : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`

export const formatPrice = (price: { amount: number; currency: string; unit: string }) => {
  if (price.unit === EPriceUnit.FREE || price.amount === 0) return 'Free'

  const amount = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: price.currency,
    maximumFractionDigits: Number.isInteger(price.amount) ? 0 : 2
  }).format(price.amount)
  const unit = PRICE_UNIT_LABELS[price.unit]

  return unit ? `${amount} ${unit}` : amount
}

/** "Food place: none in the catalogue", "Food place: nothing fits your rule Vegetarian" */
export const formatGap = (gap: TTripGapRes) => {
  // Gaps carry the item kind only; a place gap whose removing rules are about food is a missing food place
  const kind = gap.kind === EItemKind.PLACE && gap.facts.some(fact => fact.domain === EPreferenceDomain.FOOD)
    ? 'Food place'
    : ITEM_KIND_LABELS[gap.kind]
  if (gap.reason === EGapReason.NONE_IN_CATALOGUE) return `${kind}: none in the catalogue`
  if (gap.reason === EGapReason.NOT_PLANNED) return `${kind}: the planner couldn't fit one that passes our checks`
  if (!gap.facts.length) return `${kind}: nothing fits your rules`

  return `${kind}: nothing fits your rule${gap.facts.length > 1 ? 's' : ''} ${formatNames(gap.facts.map(fact => fact.value))}`
}

export const UNMET_REASON_LABELS: Record<EUnmetReason, string> = {
  [EUnmetReason.NOT_IN_CATALOGUE]: 'there\'s no such option in our catalogue',
  [EUnmetReason.EXCLUDED_BY_RULE]: 'your hard rules remove every option that fits',
  [EUnmetReason.DOESNT_FIT]: 'no matching option fits the days, times or opening hours'
}

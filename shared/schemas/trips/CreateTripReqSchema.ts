import dayjs from 'dayjs'
import { z } from 'zod'

import { CitySchema } from '~~/shared/schemas/cities/CitySchema'
import { MAX_TRIP_DAYS } from '~~/shared/constants/trips'
import { isValidTimeZone, localNow } from '~~/shared/utils/timeZone'

export const CreateTripReqSchema = z.object({
  origin: z.object(CitySchema.shape, { error: 'Choose where the trip starts' }),
  destination: z.object(CitySchema.shape, { error: 'Choose a destination' }),
  startDate: z.iso.date('Choose a start date'),
  endDate: z.iso.date('Choose an end date'),
  companionIds: z.array(z.uuid()).default([]),
  notes: z.string().trim().max(1000).nullable()
    .default(null),
  // The traveller's IANA zone: "today" and "now" for planning are theirs, not the server's
  timeZone: z.string().refine(isValidTimeZone, 'Unknown time zone'),
  whatsappOptIn: z.boolean(),
  whatsappNumber: z.string().trim().regex(/^\+[1-9]\d{6,14}$/, 'Enter the number in international format, e.g. +48123456789').nullable()
    .default(null)
}).superRefine((req, ctx) => {
  if (req.origin.id === req.destination.id) {
    ctx.addIssue({ code: 'custom', path: ['destination'], message: 'Choose a destination other than the starting point' })
  }
  if (isValidTimeZone(req.timeZone) && req.startDate < localNow(req.timeZone).date) {
    ctx.addIssue({ code: 'custom', path: ['startDate'], message: 'Start date can\'t be in the past' })
  }
  const spanDays = dayjs(req.endDate).diff(req.startDate, 'day') + 1
  if (spanDays < 1) {
    ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'End date can\'t be before the start date' })
  } else if (spanDays > MAX_TRIP_DAYS) {
    ctx.addIssue({ code: 'custom', path: ['endDate'], message: `End date: a trip can be at most ${MAX_TRIP_DAYS} days` })
  }
  if (req.whatsappOptIn && !req.whatsappNumber) {
    ctx.addIssue({ code: 'custom', path: ['whatsappNumber'], message: 'WhatsApp number is required to get the message' })
  }
  // A number is stored only with consent to message it
  if (req.whatsappNumber && !req.whatsappOptIn) {
    ctx.addIssue({ code: 'custom', path: ['whatsappOptIn'], message: 'Tick this to get the message, or clear the number' })
  }
})

export type TCreateTripReq = z.infer<typeof CreateTripReqSchema>

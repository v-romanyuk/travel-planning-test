import { z } from 'zod'

import { CitySchema } from '~~/shared/schemas/cities/CitySchema'
import { EPersonRole } from '~~/shared/schemas/knowledge-graph/PersonRole'
import { CitedFactSchema } from '~~/shared/schemas/trips/CitedFactSchema'
import { EGapReason } from '~~/shared/schemas/trips/GapReason'
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'
import { EMessageAuthor } from '~~/shared/schemas/trips/MessageAuthor'
import { EMessageKind } from '~~/shared/schemas/trips/MessageKind'
import { RunExclusionSchema } from '~~/shared/schemas/trips/RunExclusionSchema'
import { UnmetRequestSchema } from '~~/shared/schemas/trips/UnmetRequestSchema'
import { ERunStatus } from '~~/shared/schemas/trips/RunStatus'
import { TransportDetailsSchema } from '~~/shared/schemas/trips/TransportDetailsSchema'
import { ETripStatus } from '~~/shared/schemas/trips/TripStatus'
import { UnverifiedFactSchema } from '~~/shared/schemas/trips/UnverifiedFactSchema'

const isoDateTime = z.date().transform(d => d.toISOString())

export const TripResSchema = z.object({
  id: z.uuid(),
  origin: CitySchema,
  destination: CitySchema,
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  notes: z.string().nullable(),
  status: z.enum(ETripStatus),
  failureReason: z.string().nullable(),
  companionIds: z.array(z.uuid()),
  whatsappOptIn: z.boolean(),
  // null unless opted in
  whatsappNumber: z.string().nullable(),
  travellers: z.array(z.object({
    id: z.uuid(),
    name: z.string(),
    role: z.enum(EPersonRole)
  })),
  days: z.array(z.object({
    id: z.uuid(),
    position: z.int(),
    date: z.iso.date(),
    title: z.string().nullable(),
    note: z.string().nullable(),
    items: z.array(z.object({
      id: z.uuid(),
      position: z.int(),
      kind: z.enum(EItemKind),
      name: z.string(),
      time: z.string(),
      endTime: z.string().nullable(),
      price: z.object({
        amount: z.number(),
        currency: z.string(),
        unit: z.string()
      }).nullable(),
      transport: TransportDetailsSchema.nullable(),
      why: z.string(),
      citedFacts: z.array(CitedFactSchema),
      source: z.string(),
      status: z.literal('planned'),
      note: z.string().nullable()
    }))
  })),
  gaps: z.array(z.object({
    date: z.iso.date().nullable(),
    kind: z.enum(EItemKind),
    reason: z.enum(EGapReason),
    facts: z.array(CitedFactSchema)
  })),
  unverifiedFacts: z.array(UnverifiedFactSchema),
  messages: z.array(z.object({
    id: z.uuid(),
    author: z.enum(EMessageAuthor),
    kind: z.enum(EMessageKind),
    body: z.string(),
    createdAt: isoDateTime
  })),
  latestRun: z.object({
    id: z.uuid(),
    status: z.enum(ERunStatus),
    failureReason: z.string().nullable(),
    startedAt: isoDateTime.nullable(),
    finishedAt: isoDateTime.nullable(),
    exclusions: z.array(RunExclusionSchema)
  }).nullable(),
  // The run that produced the items on screen; null = the trip has never had a plan
  planRun: z.object({
    id: z.uuid(),
    finishedAt: isoDateTime,
    exclusions: z.array(RunExclusionSchema),
    unmetRequests: z.array(UnmetRequestSchema)
  }).nullable()
})

export type TTripRes = z.infer<typeof TripResSchema>

import { z } from 'zod'

import { CitedFactSchema } from '~~/shared/schemas/trips/CitedFactSchema'
import { EGapReason } from '~~/shared/schemas/trips/GapReason'
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'
import { UnmetRequestSchema } from '~~/shared/schemas/trips/UnmetRequestSchema'

// A save_plan call after code validation: refs only, facts are copied from the catalogue when the plan is written
export const SavedPlanSchema = z.object({
  days: z.array(z.object({
    date: z.iso.date(),
    title: z.string().nullable(),
    items: z.array(z.object({
      ref: z.string(),
      time: z.string(),
      why: z.string(),
      citedFacts: z.array(CitedFactSchema)
    }))
  })),
  gaps: z.array(z.object({
    kind: z.enum(EItemKind),
    date: z.iso.date().nullable(),
    reason: z.enum(EGapReason),
    facts: z.array(CitedFactSchema)
  })),
  // Plans saved before notes were reported have none
  unmetRequests: z.array(UnmetRequestSchema).default([])
})

export type TSavedPlan = z.infer<typeof SavedPlanSchema>

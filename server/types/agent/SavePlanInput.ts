import { z } from 'zod'

import { EGapReason } from '~~/shared/schemas/trips/GapReason'
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'
import { EUnmetReason } from '~~/shared/schemas/trips/UnmetReason'

export const SavePlanInputSchema = z.object({
  days: z.array(z.object({
    date: z.string().describe('YYYY-MM-DD, one of the trip dates'),
    title: z.string().max(120).optional().describe('short day title, used only where the traveller set none'),
    items: z.array(z.object({
      ref: z.string().describe('catalogue ref from search_catalogue'),
      time: z.string().describe('HH:mm; for transport and stays the catalogue time is used'),
      why: z.string().describe('why chosen; name the cited preference, or say "No stored preference applied" and the reason'),
      citedFactIds: z.array(z.string()).default([]).describe('ids of preferences this entry matches: from matchesPreferences, or a not-checkable preference you judged it to meet'),
      readdsRemoved: z.boolean().optional().describe('true only to bring back an item the traveller removed; give the reason in why')
    }))
  })),
  gaps: z.array(z.object({
    kind: z.enum(EItemKind),
    date: z.string().nullable().optional().describe('YYYY-MM-DD, or null for the whole trip'),
    reason: z.enum([EGapReason.NONE_IN_CATALOGUE, EGapReason.ALL_EXCLUDED]).describe('none_in_catalogue: nothing exists; all_excluded: hard constraints removed every option')
  })).default([]),
  unmetRequests: z.array(z.object({
    request: z.string().describe('the traveller\'s words, copied exactly from the trip notes or a day note'),
    reason: z.enum(EUnmetReason).describe('not_in_catalogue: no result matches it; excluded_by_rule: hard constraints removed every match; doesnt_fit: matches exist but none fits the days, times or opening hours')
  })).default([]).describe('every wish in the notes this plan does not follow, fully or in part')
})

export type TSavePlanInput = z.infer<typeof SavePlanInputSchema>

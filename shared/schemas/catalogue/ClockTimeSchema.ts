import { z } from 'zod'

// Wall-clock time without seconds, e.g. "09:30"
export const ClockTimeSchema = z.iso.time({ precision: -1, error: 'Expected a time as HH:mm' })

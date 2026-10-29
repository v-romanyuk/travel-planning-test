import { z } from 'zod'

import { CitySchema } from '~~/shared/schemas/cities/CitySchema'

export const CitiesResSchema = z.array(CitySchema)

export type TCitiesRes = z.infer<typeof CitiesResSchema>

import { listTrips } from '~~/server/controllers/trips/listTrips'
import { TripsListResSchema } from '~~/shared/schemas/trips/TripsListResSchema'

export default defineEventHandler(async (event) => {
  const trips = await listTrips(event.context.user!)

  return TripsListResSchema.parse(trips)
})

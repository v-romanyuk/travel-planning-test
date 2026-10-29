import { replanTrip } from '~~/server/controllers/trips/replanTrip'
import { TripParamsReqSchema } from '~~/shared/schemas/trips/TripParamsReqSchema'
import { TripResSchema } from '~~/shared/schemas/trips/TripResSchema'

export default defineEventHandler(async (event) => {
  const { tripId } = await getValidatedRouterParams(event, p => TripParamsReqSchema.parse(p))
  const trip = await replanTrip(event.context.user!, tripId)

  return TripResSchema.parse(trip)
})

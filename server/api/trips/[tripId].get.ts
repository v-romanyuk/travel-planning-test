import { getTrip } from '~~/server/controllers/trips/getTrip'
import { TripParamsReqSchema } from '~~/shared/schemas/trips/TripParamsReqSchema'
import { TripResSchema } from '~~/shared/schemas/trips/TripResSchema'

export default defineEventHandler(async (event) => {
  const { tripId } = await getValidatedRouterParams(event, p => TripParamsReqSchema.parse(p))
  const trip = await getTrip(event.context.user!, tripId)

  return TripResSchema.parse(trip)
})

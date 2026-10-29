import { updateTripDay } from '~~/server/controllers/trips/updateTripDay'
import { TripDayParamsReqSchema } from '~~/shared/schemas/trips/TripDayParamsReqSchema'
import { TripResSchema } from '~~/shared/schemas/trips/TripResSchema'
import { UpdateTripDayReqSchema } from '~~/shared/schemas/trips/UpdateTripDayReqSchema'

export default defineEventHandler(async (event) => {
  const { tripId, dayId } = await getValidatedRouterParams(event, p => TripDayParamsReqSchema.parse(p))
  const body = await readValidatedBody(event, b => UpdateTripDayReqSchema.parse(b))
  const trip = await updateTripDay(event.context.user!, tripId, dayId, body)

  return TripResSchema.parse(trip)
})

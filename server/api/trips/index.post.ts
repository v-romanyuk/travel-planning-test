import { createTrip } from '~~/server/controllers/trips/createTrip'
import { CreateTripReqSchema } from '~~/shared/schemas/trips/CreateTripReqSchema'
import { TripResSchema } from '~~/shared/schemas/trips/TripResSchema'

// Responds once the trip and the acknowledgement are stored; planning runs on the queue worker
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, b => CreateTripReqSchema.parse(b))
  const trip = await createTrip(event.context.user!, body)

  setResponseStatus(event, 201)

  return TripResSchema.parse(trip)
})

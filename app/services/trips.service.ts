import type { TCreateTripReq } from '~~/shared/schemas/trips/CreateTripReqSchema'
import type { TUpdateTripDayReq } from '~~/shared/schemas/trips/UpdateTripDayReqSchema'

class TripsService {
  getAll () {
    return $fetch('/api/trips')
  }

  getById (tripId: string) {
    return $fetch(`/api/trips/${tripId}`)
  }

  createTrip (body: TCreateTripReq) {
    return $fetch('/api/trips', { method: 'POST', body })
  }

  updateDay (tripId: string, dayId: string, body: TUpdateTripDayReq) {
    return $fetch(`/api/trips/${tripId}/days/${dayId}`, { method: 'PATCH', body })
  }

  replanTrip (tripId: string) {
    return $fetch(`/api/trips/${tripId}/replan`, { method: 'POST' })
  }
}

export const tripsService = new TripsService()

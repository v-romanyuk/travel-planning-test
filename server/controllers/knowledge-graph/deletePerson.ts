import { repos } from '~~/server/repos'
import { isForeignKeyViolation } from '~~/server/utils/dbUtils'
import { createUserError } from '~~/server/utils/errorUtils'
import { EPersonRole } from '~~/shared/schemas/knowledge-graph/PersonRole'

// Their facts go with them (FK cascade). Trips keep their traveller list intact, so someone on a trip stays
export const deletePerson = async (userId: string, personId: string) => {
  const person = await repos.peopleRepo.findPersonById(userId, personId)
  if (!person) throw createUserError({ statusCode: 404, message: 'This person wasn\'t found.' })
  if (person.role === EPersonRole.TRAVELLER) {
    throw createUserError({ statusCode: 400, message: 'You can\'t remove yourself from your own profile.' })
  }

  const onTrips = (tripCount: number) => createUserError({
    statusCode: 409,
    message: `${person.name} is on ${tripCount === 1 ? 'a trip' : `${tripCount} trips`}, so they can't be removed.`
  })

  const tripCount = await repos.tripTravellersRepo.countTripTravellersByPersonId(personId)
  if (tripCount > 0) throw onTrips(tripCount)

  const deleted = await repos.peopleRepo.deleteCompanion(userId, personId).catch((error: unknown) => {
    // Added to a trip after the count: the trip_travellers FK (restrict) refuses the delete
    if (isForeignKeyViolation(error)) throw onTrips(1)
    throw error
  })
  if (deleted === 0) throw createUserError({ statusCode: 404, message: 'This person wasn\'t found.' })
}

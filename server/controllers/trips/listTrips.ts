import { repos } from '~~/server/repos'
import type { TUser } from '~~/server/types/user/User'

export const listTrips = (user: TUser) => repos.tripsRepo.findTripsByUserId(user.id)

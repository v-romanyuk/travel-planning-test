import { repos } from '~~/server/repos'
import type { TUpdateMeReq } from '~~/shared/schemas/users/UpdateMeReqSchema'

// Only new trips read the home city; existing trips keep the origin they were created with
export const updateMe = async (userId: string, { homeCity }: TUpdateMeReq) => {
  return repos.usersRepo.updateUserHomeCity(userId, homeCity)
}

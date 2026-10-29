import type { TInsertUser } from '~~/server/types/user/InsertUser'
import type { TUser } from '~~/server/types/user/User'
import type { TCity } from '~~/shared/schemas/cities/CitySchema'

export interface IUsersRepo {
  findUserById: (userId: string) => Promise<TUser | undefined>
  findUserBySub: (subId: string) => Promise<TUser | undefined>
  insertUser: (input: TInsertUser) => Promise<TUser>
  updateUserHomeCity: (userId: string, homeCity: TCity) => Promise<TUser>
}

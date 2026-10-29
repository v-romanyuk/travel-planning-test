import type { TUser } from '~~/server/types/user/User'

export type TInsertUser = Pick<TUser, 'subId' | 'email' | 'fullName' | 'homeCity'>

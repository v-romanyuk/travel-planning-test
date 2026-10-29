import { catalogueEntriesRepo } from './catalogueEntries.repo'
import { peopleRepo } from './people.repo'
import { profileFactsRepo } from './profileFacts.repo'
import { tripDaysRepo } from './tripDays.repo'
import { tripGapsRepo } from './tripGaps.repo'
import { tripItemsRepo } from './tripItems.repo'
import { tripMessagesRepo } from './tripMessages.repo'
import { tripRunsRepo } from './tripRuns.repo'
import { tripsRepo } from './trips.repo'
import { tripTravellersRepo } from './tripTravellers.repo'
import { usersRepo } from './users.repo'

import type { TDrizzle } from '~~/server/utils/drizzle'

export const buildRepos = (db: TDrizzle) => ({
  usersRepo: usersRepo(db),
  peopleRepo: peopleRepo(db),
  profileFactsRepo: profileFactsRepo(db),
  catalogueEntriesRepo: catalogueEntriesRepo(db),
  tripsRepo: tripsRepo(db),
  tripTravellersRepo: tripTravellersRepo(db),
  tripDaysRepo: tripDaysRepo(db),
  tripItemsRepo: tripItemsRepo(db),
  tripGapsRepo: tripGapsRepo(db),
  tripMessagesRepo: tripMessagesRepo(db),
  tripRunsRepo: tripRunsRepo(db)
})

export type TRepos = ReturnType<typeof buildRepos>

let cached: TRepos | undefined

export const repos: TRepos = new Proxy({} as TRepos, {
  get (_target, prop: string) {
    cached ??= buildRepos(useDrizzle())

    return cached[prop as keyof TRepos]
  }
})

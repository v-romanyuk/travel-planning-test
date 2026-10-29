import type { TUser } from '~~/server/types/user/User'

declare module 'h3' {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- augments h3's existing interface
  interface H3EventContext {
    user?: TUser
  }
}

export {}

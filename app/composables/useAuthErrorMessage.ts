import type { FetchError } from 'ofetch'

// Supabase AuthError carries `message`; our API puts user-facing text in `data.message`
export function useAuthErrorMessage () {
  return (error: unknown) => {
    const fetchMessage = (error as FetchError<{ message?: string }>).data?.message
    if (fetchMessage) return fetchMessage
    if ((error as { code?: string }).code === 'invalid_credentials') return 'Email or password is incorrect'

    return 'Something went wrong. Try again.'
  }
}

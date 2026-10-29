import type { FormError } from '@nuxt/ui'
import type { FetchError } from 'ofetch'

interface IApiErrorBody {
  message?: string
  data?: { issues?: IIssue[] }
}

interface IIssue {
  path?: PropertyKey[]
  message?: string
}

// h3 puts a failed Zod parse's issues in `data` and their JSON in `message`
const readIssues = (body: IApiErrorBody | undefined): IIssue[] => {
  if (Array.isArray(body?.data?.issues)) return body.data.issues
  if (!body?.message?.startsWith('[')) return []

  try {
    const parsed: unknown = JSON.parse(body.message)

    return Array.isArray(parsed) ? parsed as IIssue[] : []
  } catch {
    return []
  }
}

/** The server's message for the traveller (`FetchError.data.message`), else the fallback. */
export const getErrorMessage = (error: unknown, fallback = 'Something went wrong. Try again.') => {
  const body = (error as FetchError<IApiErrorBody>).data
  const [issue] = readIssues(body)
  if (issue?.message) return issue.message

  return body?.message || fallback
}

/** A request the server's Zod schema rejected, as errors for the `UFormField`s that caused them. */
export const getFormErrors = (error: unknown): FormError[] => {
  const body = (error as FetchError<IApiErrorBody>).data

  return readIssues(body)
    .filter(issue => issue.message && issue.path?.length)
    .map(issue => ({ name: issue.path!.map(String).join('.'), message: issue.message! }))
}

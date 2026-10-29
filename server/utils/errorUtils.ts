import { STATUS_CODES } from 'node:http'

interface ICreateUserErrorArgs {
  statusCode: number
  message: string
  data?: Record<string, unknown>
}

// User-facing text goes in `message`: h3 strips non-ASCII from `statusMessage` (it's an HTTP reason phrase),
// while the JSON error body carries `message` verbatim — the FE reads it from `FetchError.data.message`.
export const createUserError = ({ statusCode, message, data }: ICreateUserErrorArgs) => createError({
  statusCode,
  statusMessage: STATUS_CODES[statusCode],
  message,
  data
})

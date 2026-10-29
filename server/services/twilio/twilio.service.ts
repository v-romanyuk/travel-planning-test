import type { FetchError } from 'ofetch'

// Twilio Messages API, plain REST: one POST doesn't justify the SDK. https://www.twilio.com/docs/messaging/api/message-resource
const BASE_URL = 'https://api.twilio.com/2010-04-01'
const SEND_TIMEOUT_MS = 10_000

interface ISendWhatsAppMessageInput {
  // E.164, e.g. +48123456789
  to: string
  body: string
}

/** A send Twilio didn't accept. `ref` is the Twilio error code, `timeout`, `network` or `http_<status>`. */
export class TwilioSendError extends Error {
  constructor (readonly ref: string) {
    super(`Twilio send failed: ${ref}`)
    this.name = 'TwilioSendError'
  }
}

const toRef = (error: unknown) => {
  if (!(error instanceof Error) || error.name !== 'FetchError') return 'network'

  const { data, response, cause } = error as FetchError

  const code = (data as { code?: unknown } | undefined)?.code
  if (typeof code === 'number' || typeof code === 'string') return String(code)
  if (response) return `http_${response.status}`

  return (cause as { name?: string } | undefined)?.name === 'TimeoutError' ? 'timeout' : 'network'
}

export const useTwilioService = () => {
  const { twilioAccountSid, twilioAuthToken, twilioWhatsappFrom } = useRuntimeConfig()

  const isConfigured = () => Boolean(twilioAccountSid && twilioAuthToken && twilioWhatsappFrom)

  // Never retried: a timeout may still have been delivered, and sandbox rejections stay until the traveller acts
  const sendWhatsAppMessage = async ({ to, body }: ISendWhatsAppMessageInput) => {
    const response = await $fetch<{ sid: string }>(`${BASE_URL}/Accounts/${encodeURIComponent(twilioAccountSid)}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ From: `whatsapp:${twilioWhatsappFrom}`, To: `whatsapp:${to}`, Body: body }),
      timeout: SEND_TIMEOUT_MS,
      retry: false
    }).catch((error: unknown) => {
      throw new TwilioSendError(toRef(error))
    })

    return { sid: response.sid }
  }

  return { isConfigured, sendWhatsAppMessage }
}

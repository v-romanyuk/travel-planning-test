# Plan: WhatsApp notification (Twilio)

_Refs: client brief "WhatsApp" section · `plans/planning-core.md` (run lifecycle, `onRunFinished`) · `plans/trip-screens.md` (plan page link target)_

## Overview

When a planning run finishes, ready or failed, the traveller gets one WhatsApp message through the Twilio sandbox if they gave a number and opted in. The message is a short status line and a link to the plan page. Each run records what happened to its message, so a message cut off by a restart is sent at the next boot instead of being lost.

## Acceptance criteria

- [x] **AC-1** (standing: outbound WhatsApp notification) — A message is sent only when the traveller gave a number and opted in. Without either, no message is sent and the run still finishes normally.
- [x] **AC-2** (standing: outbound WhatsApp notification) — Exactly one message per run's terminal state. A retry or re-delivery does not send a duplicate. The only accepted exception: the process crashes after Twilio accepted the message but before `sent` was saved, and the boot sweep then sends it a second time (AC-10).
- [x] **AC-3** (standing: outbound WhatsApp notification) — The message says whether the plan is ready or failed. Its link, opened in a fresh browser, goes through login and lands on that trip's plan page.
- [x] **AC-4** (standing: outbound WhatsApp notification) — A failed send does not change the trip's status. It is logged with the trip id, never with the phone number or the message body.
- [x] **AC-5** — Every path that ends a run produces one message, for a first plan and a re-plan alike:
  - a successful plan
  - any `RunStop` failure, including a timeout
  - an unexpected error
  - a dead-lettered job
  - a run whose job couldn't be queued

  _Check:_ a trip's first plan, its re-plan, and a run to a destination with no catalogue entries (seeded Reykjavik or Kraków).
- [x] **AC-6** — The text contains only a status line, the trip's dates and the plan link. It never contains a destination or origin name, an item name, a price or a time. The run counts as a re-plan when another run of the same trip, created earlier, has status `succeeded`; this is checked at send time.

  | Case | Text |
  |---|---|
  | Ready | `Your trip plan for <dates> is ready: <link>` |
  | Ready, re-plan | `Your updated trip plan for <dates> is ready: <link>` |
  | Failed | `We couldn't plan your trip for <dates>. Details: <link>` |
  | Failed, re-plan | `We couldn't update your trip plan for <dates> — your previous plan is still there: <link>` |
- [x] **AC-7** — `<dates>` is the trip's start and end in English short form. The year appears only when start and end fall in different years.

  | Trip | Shown as |
  |---|---|
  | Same day | `12 Nov` |
  | Same month | `12–15 Nov` |
  | Across months | `28 Nov – 2 Dec` |
  | Across years | `30 Dec 2026 – 2 Jan 2027` |
- [x] **AC-8** — `<link>` is `<public.appUrl>/trips/<tripId>/plan`. On the deployed app it uses the Fly URL, never `localhost`.
- [x] **AC-9** — Every run that ends after this ships records its notification outcome on `trip_runs`. A run that is still queued or running has no outcome. Runs that finished before the migration keep `null`.

  | Outcome | When | Recorded with it |
  |---|---|---|
  | `skipped` | no number, not opted in, or Twilio not configured | nothing |
  | `sent` | Twilio accepted the message | the message SID |
  | `failed` | anything else | the Twilio error code, `timeout`, `network`, `http_<status>` or `expired` |
- [x] **AC-10** — A run left `pending` (terminal state committed, message not recorded) is handled at the next boot. Its age is counted from `finishedAt`:
  - finished between 2 minutes and 24 hours ago: the message is sent;
  - finished more than 24 hours ago: marked `failed`/`expired`, nothing sent.

  The sweep runs once per boot, in the background, one send at a time. It never delays the planning workers from starting.
  _Check:_ set a finished run's notification back to `pending` and its `finishedAt` to 10 minutes ago, restart the server, and see one message arrive and the status become `sent`.
- [x] **AC-11** — Twilio counts as configured only when the account SID, the auth token and the sender number are all non-empty. Without them:
  - runs finish exactly as before;
  - the notification is `skipped`;
  - each such run logs one line saying Twilio is not configured.

  Local dev needs no Twilio account.
- [x] **AC-12** — A failed send is never retried. It never fails or retries the planning run, and never delays it beyond the 10 s send timeout. The notification becomes `failed` with the error reference. Failed sends include:
  - a Twilio rejection, e.g. 63015 (number hasn't joined the sandbox)
  - a network error
  - an HTTP error with no Twilio code
  - no answer within 10 s, recorded as `failed`/`timeout` even though Twilio may have delivered it
- [x] **AC-13** — Notification log lines carry the trip id, run id, notification status, and the Twilio SID or error reference. They never carry the phone number, the message body or the Twilio credentials.

## Architecture

### How it works

A run ends in one transaction. `finishTripRun` is the guard that ends each run once. Its update now also sets `notificationStatus`:
- `pending` when the trip has `whatsappOptIn` and a `whatsappNumber`;
- `skipped` otherwise.

The number and opt-in are fixed when the trip is created, so a re-plan uses the stored values.

After the commit, `onRunFinished(runId)` runs. It is `async` and catches everything, so nothing it does can reach the run. In order, it:
1. loads the run and its trip;
2. returns if the run isn't `pending`;
3. marks it `skipped` and logs if Twilio isn't configured;
4. builds the text from the trip's dates, the run status, and whether an earlier run of this trip succeeded (never the destination);
5. calls the Twilio service once;
6. records `sent` with the SID, or `failed` with the reference. The update only applies while the run is still `pending`.

The send is never retried.

If the process crashes between the commit and step 6, or the step-6 write itself fails, the run stays `pending`. At boot, once the workers have started, a background sweep checks `pending` runs by age:
- finished more than 2 minutes but less than 24 hours ago: goes through the same path, one at a time;
- finished more than 24 hours ago: marked `failed`/`expired`.

The 2-minute floor keeps the sweep off a send that an old process may still be making during a deploy.

The Twilio service is a thin, stateless wrapper over Twilio's REST `Messages` endpoint:
- one form-encoded `POST`, Basic auth, 10 s timeout, with the `whatsapp:` prefixes added;
- returns `{ sid }`, or throws carrying a reference: Twilio code, `timeout`, `network` or `http_<status>`;
- never decides opt-in or text, never logs numbers or bodies.

### Schema changes

`trip_runs` gets three columns. Generate the migration with `pnpm db:migration:generate`.
- `notification_status` — `varchar(20)`, nullable, one of `pending | sent | failed | skipped`. `null` until the run is terminal, then set by the guarded terminal update. Rows from before the migration stay `null`.
- `notification_ref` — `varchar(64)`, nullable. The Twilio SID when `sent`; the error code, `timeout`, `network`, `http_<status>` or `expired` when `failed`.
- `notified_at` — `timestamptz`, nullable. Set when `sent` or `failed` is written.

No index.

### API contract

No HTTP endpoint changes. `TripRes` is unchanged; the notification columns are not exposed to the front end.

```ts
// server/services/twilio — thin wrapper, no business logic
useTwilioService().isConfigured(): boolean   // twilioAccountSid && twilioAuthToken && twilioWhatsappFrom all non-empty
useTwilioService().sendWhatsAppMessage({ to: string /* E.164, e.g. +48123456789 */, body: string })
  : Promise<{ sid: string }>                 // throws an error carrying `ref`: '<twilio code>' | 'timeout' | 'network' | 'http_<status>'

// Twilio REST call it makes
// POST https://api.twilio.com/2010-04-01/Accounts/{twilioAccountSid}/Messages.json
// Authorization: Basic base64(sid:authToken); Content-Type: application/x-www-form-urlencoded
// From=whatsapp:{twilioWhatsappFrom}&To=whatsapp:{to}&Body={body}
// 201 → { sid: 'SM…' } · 4xx → { code: 63015, message, status }

// server/controllers/shared/planning/onRunFinished — was (tripId, status)
onRunFinished(runId: string): Promise<void>  // never rejects; loads run + trip itself

// finishTripRun (single-settle guard) also takes the notification status to write in the same UPDATE
finishTripRun(runId, status, failureReason, notificationStatus: 'pending' | 'skipped')

// runtimeConfig (server-only) — env NUXT_TWILIO_ACCOUNT_SID / NUXT_TWILIO_AUTH_TOKEN / NUXT_TWILIO_WHATSAPP_FROM
twilioAccountSid: ''
twilioAuthToken: ''
twilioWhatsappFrom: ''   // .env.example pre-fills the sandbox number +14155238886
```

Fly secrets for the demo: `NUXT_TWILIO_ACCOUNT_SID`, `NUXT_TWILIO_AUTH_TOKEN`, `NUXT_TWILIO_WHATSAPP_FROM`, `NUXT_PUBLIC_APP_URL`.

### Reuse — do not reimplement

- `finishTripRun` (`server/repos/tripRuns.repo.ts`): the guard that ends a run once. The notification status goes into its update; no second guard.
- `finishRun` / `failRun` (`server/controllers/shared/planning/`): the only code that ends runs, and the only callers of `onRunFinished`.
- `onRunFinished` (`server/controllers/shared/planning/onRunFinished.ts`): the existing hook, filled in rather than replaced.
- `startPlanningWorker` (`server/controllers/shared/planning/startPlanningWorker.ts`): where boot recovery lives, next to `requeueRunsWithoutJob`. The sweep starts here.
- `findTripByIdUnscoped` (`server/repos/trips.repo.ts`): loads a trip without a signed-in user.
- `tripsTable.whatsappNumber` / `whatsappOptIn`, and the E.164 check in `CreateTripReqSchema`: already validated and stored.
- `useRuntimeConfig().public.appUrl`: the base of the link.
- The geocoding service's style (`$fetch` with a `timeout`, `console.error('[prefix] …')`): the pattern for the Twilio service.
- `buildReadyMessage` / `buildFailedMessage` (`runMessages.ts`): the conversation texts. The WhatsApp text is separate and not built from them, because they may mention places.

## Key decisions

- **Each run tracks its message, and the boot sweep re-sends `pending`.** A restart must not silently lose a message. The cost is a rare duplicate.
- **`pending` or `skipped` is set by the same guarded update that ends the run.** Whether a message is owed is never ambiguous.
- **The text uses dates, never the city.** The brief says "no place names", and the destination is one.
- **Four wordings.** A failed re-plan says the previous plan is still there.
- **Every finished run notifies.** That includes a first plan, a re-plan, and a run that was never queued.
- **Plain REST via `$fetch`, no `twilio` SDK.** It's one POST, matches the geocoding service, and adds no dependency.
- **No retry when a send fails.** The sandbox errors (63015, 63016) are permanent until the traveller acts. A timeout counts as failed rather than risking a duplicate.
- **A boot re-send expires after 24 h.** A late "plan ready" is noise, and it would fall outside WhatsApp's 24 h window anyway.
- **The sweep never blocks the workers.** It runs after they start, one send at a time, with the 2-minute floor.
- **Twilio is optional.** Missing credentials mean `skipped`.
- **Server only, no UI.** The outcome lives on `trip_runs` and in logs, so there's no `## Verify`.

## Non-goals

- Incoming WhatsApp messages or a Twilio webhook (handling `join`, replies).
- Twilio delivery-status callbacks (`delivered`/`read`). `sent` means Twilio accepted the message.
- Showing notification status in the UI or `TripRes`, and re-sending from the UI.
- WhatsApp templates, and approval of a production sender.
- Changing a trip's number or opt-in after creation; a WhatsApp number on the profile.
- Backfilling runs that finished before the migration.
- The standing "any UI surface" block, because there's no screen.

## Blockers & dependencies

- **Depends on the planning core** (`plans/planning-core.md`, built): the code that ends runs, `onRunFinished`, and the boot recovery hook.
- **Depends on the trip-screens login redirect** (`plans/trip-screens.md` AC-8, in progress): AC-3's "goes through login and lands on the plan page".
- **Demo prerequisite (not code):** the phone must send `join <sandbox-code>` to the sandbox number. The join lasts 3 days. A free-form message only goes through within 24 h of the phone's last message, so join shortly before the demo.

## Decisions taken

- **`ENotificationStatus` is server-only (`server/types/trips/NotificationStatus.ts`)** — the columns never reach `TripRes`, so no shared enum (AC-9 / schema)
- **The trip is read inside the terminal tx, right before `finishTripRun`** — the guarded update needs opt-in + number to write `pending`/`skipped`; no external call in the tx (AC-1, AC-9)
- **`skipped` leaves `notified_at` null** — the plan sets it only for `sent`/`failed`; `expired` sets it (it is a `failed` write) (AC-9, AC-10)
- **Sweep = one bulk `UPDATE … failed/expired` for > 24 h, then sends 2 min–24 h oldest first through `onRunFinished`** — reuses the single send path and the `pending`-only settle guard (AC-10)
- **Not-configured log only for runs that would have sent** — runs without number/opt-in are `skipped` by the terminal update and never reach the send path (AC-11)
- **`onRunFinished` stays awaited in `finishRun`/`failRun`** — the job/request completes at most 10 s later (send timeout); a run that couldn't be queued delays that `POST` response by the send, only on a queue failure (AC-5, AC-12)
- **Twilio errors classified by duck-typing `FetchError` (`error.name`)** — `ofetch` isn't a direct dependency, so only a type import; `$fetch` gets `retry: false` explicitly (AC-12)
- **Unexpected errors log `error.name` only** — Drizzle error messages embed query params, i.e. the phone number (AC-13)
- **Link base falls back to `https://$FLY_APP_NAME.fly.dev` when `public.appUrl` is still localhost on Fly** — a missing `NUXT_PUBLIC_APP_URL` secret would otherwise text a dead link; trailing slashes trimmed (AC-8)

# Planning run

The background agent run: from a queued `trip_runs` row to a `ready` or `failed` trip. Product rules live in
`plans/planning-core.md`; this file covers why the code is shaped the way it is.

## Lifecycle

```
POST /api/trips | replan ──tx──▶ trip planning + run queued ──after commit──▶ pg-boss job (singletonKey = trip id)
                                                                                  │
worker (startPlanningWorker, in the web process) ◀───────────────────────────────┘
  run queued → running (startedAt, unverifiedFacts snapshot)   or   running → resume from LangGraph checkpoint
  pre-checks (no destination entries / no stay survives) ──▶ failRun
  agent (thread_id = run id, abort at startedAt + agentRunTimeoutSeconds)
  draftPlan saved by save_plan (or salvaged) ──▶ finishRun (one tx)   else ──▶ failRun
  same UPDATE that ends the run sets notification pending (opted in + number) or skipped
  after commit: onRunFinished(runId) ──▶ one WhatsApp message, run notification sent | failed | skipped
```

## Invariants

- **Every exit settles the run.** `runPlanTripJob` catches everything and calls `failRun`; the job then completes, so a
  planning failure (error, timeout, nothing left to salvage) is never retried. Only a dead process leaves a job `active`.
- **`finishTripRun` is the guard.** Both `finishRun` and `failRun` start their tx with a conditional update
  (`status in (queued, running)`); the loser of a race writes nothing. Don't write trip status outside these two.
- **One run per trip.** `markTripPlanning` flips a trip only when it isn't `planning` (409 otherwise), and the
  `singleton` queue policy keeps at most one active job per trip key.
- **The agent can't author facts.** Tools return catalogue rows with hard-constraint violators already removed;
  `save_plan` takes refs only and `validatePlan` re-checks every rule. `finishRun` copies name, price and times from the
  catalogue row. Messages are templated (`runMessages.ts`), so no agent text reaches the conversation.
- **Exclusions are disclosed in full.** At start every candidate entry is run through the hard rules and the removals
  are stored, not only those the agent happened to search. Candidates: the destination, both legs, and day-trip towns
  (train/bus legs of 2 h at most from the destination, never flights, or every city it flies to would count).
- **Run records outlive the profile.** Exclusions and cited facts carry the fact's kind, domain and subject name
  (`toExclusions`, `toCitedFact`), so the plan's aside still reads right after a fact or companion is deleted.
- **A traveller's note is never lost.** `finishRun` carries each live item's note to the first new item for the same
  catalogue entry, else appends it to that day's note as "Note on <name>: <note>" (`carryItemNotes`). Day titles the
  traveller set (`titleSetByTraveller`) are never overwritten. Every other day's title belongs to the last plan:
  `setPlannerDayTitle` replaces it each run, or clears it when the plan gives none, so a re-plan can't keep a title
  that names things the new plan dropped.
- **"Not in the catalogue" is checked, not trusted.** `correctReasons` rewrites a `none_in_catalogue` gap to
  `all_excluded` when every relevant candidate (trip legs on the first/last day, day-trip legs between, every stay or
  place) exists but was excluded, and a `not_in_catalogue` wish to `excluded_by_rule` when it names a city whose legs
  a rule removed. Only towards "a rule did it": code can't tell whether a kept option would have fitted.
- **A wish in the notes is followed or reported.** `unmetRequests` lists what the plan doesn't follow, in the
  traveller's words (`checkUnmetRequests` drops any that don't quote the trip or day notes). It lives in `draftPlan`,
  so `getTrip` reads it from the plan's run. A misquote has no fix, so it never blocks a salvage.
- **A rejected plan is corrected, not fatal.** `save_plan` returns every error to the agent for
  `MAX_PLAN_REJECTIONS - 1` corrections. On the last try — or when the agent stops after a rejection without saving
  (`salvageLastAttempt`) — code salvages that attempt instead: every item with an issue is left out and each missing
  piece becomes a `not_planned` gap (`salvagePlan`). Every issue in `placeItems`/`planRules` carries that fix
  (`drop` / `addGap` / `dropGap`); a new check without one can't be salvaged and loops until the pass cap. Salvage never
  adds or changes an item, so grounding holds. Only a salvage that leaves zero items fails the run. Earlier, two
  rejections failed the whole run on fixable slips (a place 15 min before opening, one place used twice).
- **Day edits can't race a run.** `updateTripDay` locks the trip row (`findTripByIdForUpdate`) and rejects a `planning`
  trip with 409, so `markTripPlanning` waits for the save to commit and the next run reads the edited trip.
- **Planning runs on the traveller's clock.** The trip stores the request's IANA `timeZone`; `planningClock` gives "now"
  there. A run for a trip whose start date has passed fails (`tripStarted`); when the trip starts today, nothing but
  the stay may start before now + 1 h (rounded up to the quarter hour) — told to the agent and enforced in `placeItems`.
  Catalogue times are local to their city, and the traveller is assumed to be in their request's zone.
- **A re-plan says so.** With an earlier succeeded run, the ack (`REPLAN_ACK_MESSAGE`), ready and failed messages use
  re-plan wording; "Try again" after a failed first run keeps the first-plan wording.
- **Removed items stay.** `deleteLiveTripItemsByTripId` skips `removedAt` rows; that's why `trip_items`' position
  uniqueness is a partial index over live items.

## WhatsApp notification

Product rules: `plans/whatsapp-notification.md`. One message per run, decided by the run, not the trip.

- **Owed or not is written with the terminal state.** `finishTripRun` sets `notification_status` to `pending` or
  `skipped` in the guarded update, so a run that settled never has an ambiguous "should we send?". Don't move this into
  `onRunFinished`: a crash between commit and that call would then lose the message with nothing to find it by.
- **`pending` is the only state that sends.** `settleTripRunNotification` updates only while `pending`, so the boot
  sweep and a late in-flight send can't both record (they can both *send* — see below).
- **`onRunFinished` never rejects and never retries.** Its failures (DB, Twilio, anything) are logged and swallowed; the
  trip status is already committed and stays as it is. A timeout is recorded `failed`/`timeout` even though Twilio may
  have delivered: retrying would risk the duplicate we otherwise avoid.
- **The text carries dates and the link only** (`whatsappMessage.ts`), never a place — so it is built separately from
  the conversation messages in `runMessages.ts`, which name places. "Re-plan" = an earlier-created run of the trip
  succeeded, checked at send time.
- **Logs carry trip id, run id, status and SID/ref.** Never the number or body; unexpected errors log only
  `error.name`, because a Drizzle error message embeds query params (the number).

Boot sweep (`sweepPendingNotifications`, started after the workers, not awaited): `pending` runs that finished over
24 h ago → `failed`/`expired`; between 2 min and 24 h → sent through `onRunFinished`, one at a time. The 2-minute floor
keeps it off sends the previous process may still be making during a deploy. Accepted duplicate: the process dies
after Twilio accepted the message but before `sent` was written — the next boot sends it again.

The link base is `public.appUrl`; on Fly, if that still points at localhost (secret not set), it falls back to
`https://$FLY_APP_NAME.fly.dev` rather than texting a dead link.

## Crash recovery

The `plan-trip` queue has `heartbeatSeconds: 30`; the worker refreshes it while a job runs. When the process dies the
heartbeat stops and pg-boss fails the job within 30 s: it goes to retry (our worker resumes the run from its
checkpoint, the timeout still counting from the original `startedAt`) or, with the one retry used up, to
`plan-trip-dead`, whose worker fails the trip with "Planning stopped unexpectedly". Queue expiry
(`max(600, timeout + 120)` s) is the backstop. At boot, every open run without any job (crash between the trip commit
and the send) gets one re-sent.

After a timeout or an unsalvageable rejection the tools that write (`search_catalogue`, `save_plan`) turn into no-ops, so an
agent that ignores the abort signal can't touch a settled run.

## Failure modes

| Symptom | Where it comes from |
|---|---|
| `Planning couldn't start` right after a request | `sendPlanTripJob` threw or returned no id (`enqueuePlanRun`) |
| `Planning took too long` | deadline in `runWithDeadline` with no saved draft and nothing to salvage; the race returns even if a layer ignores the abort signal. A draft saved before the deadline is still written and the run ends `ready` — the agent's closing turn after `save_plan` is not worth failing a valid plan |
| `None of the options the planner picked passed our checks…` | the last rejected plan salvaged to zero items, or the checks didn't settle (`salvagePlan`); `onRejectedOut` aborts the agent |
| A `ready` plan with "the planner couldn't fit one" gaps | salvaged: the agent ran out of corrections (or stopped after a rejection) and code left out what failed |
| `Planning stopped unexpectedly` | dead-letter worker: the process died twice mid-run, or pg-boss expired the job |
| `The catalogue changed while planning` | a saved plan's catalogue row was gone when the plan was written |
| Run notification `skipped` + `[whatsapp] Twilio not configured` | one of `NUXT_TWILIO_ACCOUNT_SID` / `_AUTH_TOKEN` / `_WHATSAPP_FROM` empty |
| Run notification `failed`, ref `63015` | the number hasn't joined the Twilio sandbox (`join <code>`); `63016` = outside the 24 h window |
| Run notification `failed`, ref `timeout` / `network` / `http_<status>` | Twilio didn't answer in 10 s / no connection / HTTP error without a Twilio code |
| Run notification stuck `pending` | the process died mid-send, or the `sent`/`failed` write failed; the next boot's sweep handles it |
| Trip stuck in `planning` | the worker hasn't started — the plugin retries with backoff; look for `[planning] worker failed to start` in the server log |

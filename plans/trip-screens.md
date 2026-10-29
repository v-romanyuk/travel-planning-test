# Plan: Trip screens — request form, conversation, plan page with editing, trips list

_Refs: client brief (PoC Travel Planning PDF) · design canvas "Trip Planner prototype" (https://claude.ai/artifact/5NeKwsuj4TJwjDn7Kqomdp — boards Conversation, Plan) · `app/pages/trips/[tripId].vue` + tabs · `plans/planning-core.md`_

## Overview

The traveller-facing half of the trip: ask for a trip and leave, watch the conversation, read the plan day by day, edit a day (title, note, remove items, item notes), and re-plan from the edited trip. Built on the planning-core API; adds the day-edit and trips-list endpoints.

## Acceptance criteria

Each criterion is a rule for any user, trip or plan. The `Check:` line is one way to verify it in a browser on the local stack, signed in as the demo user (`olena@local.test`, password in the README). "The Lisbon request" = from Warsaw to Lisbon, 12–15 Nov 2026, with Taras.

**Request form (`/`)**

- [x] **AC-1** — The page shows only the request form under the heading "Where are you going?" and its intro line; there is no conversation panel until a trip exists.
- [x] **AC-2** — "Starting from" is pre-filled with the signed-in user's home city and can be changed for this trip only.
- [x] **AC-3** — "Who's going" lists the traveller (always ticked, not changeable) and every companion in the user's profile; the request includes only the ticked companions. With no companions, only the traveller is listed, with a link to the profile.
- [x] **AC-4** — The form has Destination, Starting from, start and end dates, Who's going, Notes for the planner (optional), WhatsApp opt-in and WhatsApp number. The number is required only when opted in.
- [x] **AC-5** — Submitting creates the trip and opens its conversation tab, showing the traveller's request and the planner's acknowledgement before planning finishes.
  _Check:_ the Lisbon request.
- [x] **AC-6** — Opened from a failed trip's "Change dates and try again", the form is pre-filled with that trip's origin, destination, dates, companions (skipping any no longer in the profile), notes, WhatsApp opt-in and number. Submitting creates a new trip; the failed one stays in the trips list as failed.

**Trip page (shared header)**

- [x] **AC-7** — Every trip tab shows the destination, the dates, who's going and the starting city, plus a status badge (Planning / Ready / Failed) that matches the trip.
- [x] **AC-8** — Opening `/trips/:tripId` lands on the Conversation tab while the trip is `planning`, and on the Plan tab when it's `ready` or `failed`. `/trips/:tripId/plan` (the WhatsApp link) opens the plan directly, in a fresh browser; when signed out it goes through login and then lands back on that plan.
- [x] **AC-9** — While the trip is `planning`, both tabs update on their own (status, messages, plan) within about 3 seconds of the server changing, with no reload; polling stops once the trip is `ready` or `failed`.
  _Check:_ submit the Lisbon request and watch the badge move from Planning to Ready.

**Conversation tab**

- [x] **AC-10** — The left column shows "Your request": from, destination, dates, travellers, notes when given, and the WhatsApp number only when opted in. The right column shows the trip's messages in order, each as the server wrote it.
- [x] **AC-11** — While the trip is `planning`, the conversation ends with "Planning in the background. You can close this page."
- [x] **AC-12** — A ready trip's last bubble has an "Open the plan" button that opens the Plan tab. A failed trip's last bubble shows the failure reason and a "Try again" button that starts a re-plan right away (no confirmation).

**Plan tab — ready plan**

- [x] **AC-13** — The plan shows the "Nothing in this plan is booked or paid" notice, then every day in date order with its label (Day n), date and title, then its items in time order.
- [x] **AC-14** — Each item shows its time with a label — "Departs" for transport, "Check-in" on the first day a stay appears and "Check-out" on its last — name, kind (Stay / Place / Transport), a "Planned" badge, why it was chosen, its price or "Price not in catalogue", and "Source: catalogue entry <ref>". Transport items also show from → to and the arrival time, with "(+1 day)" when it arrives the next day.
- [x] **AC-15** — A gap tied to a day appears in that day's timeline as a row naming the missing kind and why: "Food place: none in the catalogue", or "Food place: nothing fits your rule Vegetarian" when rules removed every option. Gaps not tied to a day appear above Day 1. A day with no items and no gap shows "Nothing planned for this day".
- [x] **AC-16** — A day note shows under the day's items as "Your note"; an item note shows inside its item card as "Your note".
- [x] **AC-17** — After a re-plan, an item note stays on the item for the same catalogue entry (any day). If the new plan no longer contains that entry, the note is added to that day's note as "Note on <item name>: <note>" — a traveller's note is never lost.
  _Check:_ add a note to a place, remove a different place, re-plan.
- [x] **AC-18** — The aside describes the run that produced the plan on screen. "Rules applied" lists each hard rule that removed options — with its subject and domain (e.g. "Everyone, transport"), how many it removed and their names. Rules that couldn't be checked are listed under "Couldn't check". "Preferences used" lists each preference cited by an item, with its subject and domain and the items that cited it. Nothing in the aside states a number or ranking the plan data doesn't contain.
  _Check:_ the Lisbon plan with "No red-eye flights" lists the excluded red-eye flights.
- [x] **AC-19** — The aside's "Where the facts come from" explains sources and shows the Stay / Place / Transport marker legend.

**Plan tab — editing**

- [x] **AC-20** — "Edit day" puts that day into edit mode: a title field, a note field, a "Remove from plan" button and a note field on each item, and "Save day" / "Cancel". Only one day is in edit mode at a time. "Edit day" is available on a ready plan and on a previous plan shown under a failed re-plan; never while the trip is planning.
- [x] **AC-21** — Removing items in edit mode hides them immediately; "Cancel" brings them back and discards every change in that day; "Save day" saves all changes in one request.
- [x] **AC-22** — After "Save day", the day shows "Day n saved. The planner reads this version the next time it runs.", and a reload shows the saved title, notes and removals.
- [x] **AC-23** — A title the traveller changed is never replaced by a re-plan; a title they didn't touch (the planner's) may be. Clearing a title and saving leaves the day untitled, and the next re-plan may give it one again.
- [x] **AC-24** — While a day has unsaved changes, "Re-plan with my changes" is disabled, and leaving the tab or page asks "Discard changes to Day n?".
- [x] **AC-25** — A failed save keeps the day in edit mode with everything typed, and shows the server's message.

**Plan tab — re-plan and other states**

- [x] **AC-26** — A ready trip shows a "Re-plan with my changes" button in the title row; pressing it asks for confirmation, then starts a re-plan.
- [x] **AC-27** — While a trip that has never had a plan is planning, the plan tab shows "The planner is still working" with "You can close this page."
- [x] **AC-28** — While a trip that already has a plan is planning again, the same message shows as a banner above that plan, which stays visible with "Edit day" and "Re-plan" hidden.
- [x] **AC-29** — A failed trip shows "Planning failed" with the server's reason, "Nothing was booked or charged.", and the actions "Try again" (re-plan, no confirmation), "Change dates and try again" (opens the pre-filled form) and "Review your rules" (opens the profile). If an earlier plan exists, it shows below with "Showing your previous plan".
  _Check:_ a request to Reykjavik.

**Trips list (`/trips`)**

- [x] **AC-30** — The list shows the user's trips, most recently created first: destination, dates and status badge; selecting a row opens that trip. While any trip is planning, the list refreshes on its own every 5 seconds. With no trips, it shows an empty state with a "Plan a trip" button.

**Day-edit API**

- [x] **AC-31** — Saving a day while the trip is `planning` is rejected with a readable message and changes nothing.
- [x] **AC-32** — A day, or an item in the save, that doesn't belong to the trip (or a trip of another user) is rejected (404) and changes nothing.

**Standing: any UI surface**

- [x] **AC-33** (standing: any UI surface) — Loading, empty and error states each render a distinct, readable surface — never a blank region, a bare spinner with no context, or a silent failure.
- [x] **AC-34** (standing: any UI surface) — Every failure the user can cause is surfaced to them — inline on the field/region that caused it, or via a `useToast()` toast carrying the server's message, not a generic one.
- [x] **AC-35** (standing: any UI surface) — No caught error at an async or mutation boundary is swallowed by an empty `catch` — it is either shown to the user or rethrown so it reaches the console/server log.
- [x] **AC-36** (standing: any UI surface) — Every interactive control is reachable by keyboard, and focus is visible on it.
- [x] **AC-37** (standing: any UI surface) — Copy is English and uses the product's terms — the same words the rest of the app uses for the same thing (trip, day, stay, place, transport, planned). Nothing reads as booked, reserved, confirmed or paid.
- [x] **AC-38** (standing: any UI surface) — The surface works at phone width (375px) with no horizontal page scroll — the traveller opens it from a WhatsApp link.

**Standing: table / list screen** (trips list; days and items on the plan)

- [x] **AC-39** (standing: table / list screen) — Order is stable and meaningful (days by date/position, items by time/position) and survives a reload.
- [x] **AC-40** (standing: table / list screen) — Row actions (edit / remove) take effect without a full page reload, and destructive ones ask for confirmation first.
- [x] **AC-41** (standing: table / list screen) — Long values truncate or wrap rather than widening the layout.

**Standing: form** (request form; day edit)

- [x] **AC-42** (standing: form) — Every validation rule fires on the field that caused it, with a message naming what to fix.
- [x] **AC-43** (standing: form) — Client validation matches the server's Zod Req schema — anything the server rejects shows its message on the form.
- [x] **AC-44** (standing: form) — Submit is blocked while the form is invalid, and the reason is visible without submitting.
- [x] **AC-45** (standing: form) — A failed submit preserves everything the user typed.
- [x] **AC-46** (standing: form) — Submitting twice quickly does not create two records (or start two agent runs).
- [x] **AC-47** (standing: form) — Closing a modal/slideover with unsaved changes warns, or the change is already persisted.

**Standing: multi-step flow** (request → conversation → plan)

- [x] **AC-48** (standing: multi-step flow) — Step order is fixed and the current step is visible at all times.
- [x] **AC-49** (standing: multi-step flow) — A step reached with incomplete upstream state (no trip, unknown trip id) shows why or redirects rather than rendering broken.
- [x] **AC-50** (standing: multi-step flow) — The terminal state (plan ready / planning failed) is a distinct screen, not a silent return to the start.

**Standing: detail page / slideover** (plan page)

- [x] **AC-51** (standing: detail page / slideover) — The record's identity (trip destination + dates, person name) is visible without scrolling.
- [x] **AC-52** (standing: detail page / slideover) — Every section renders with real data, including the ones the feature did not change.
- [x] **AC-53** (standing: detail page / slideover) — A record that cannot be loaded (unknown or malformed id) shows why, using the backend's message rather than a generic alert.
- [x] **AC-54** (standing: detail page / slideover) — Edits are persisted and survive a reload.

**Standing: background agent run** (starting a trip, re-plan)

- [x] **AC-55** (standing: background agent run) — Submitting the request shows the acknowledgement ("I'll plan and come back — I won't book or charge anything") in the conversation right away, before any planning has finished.
- [x] **AC-56** (standing: background agent run) — Closing the page right after submitting does not stop the run: reopening the trip later shows `ready` or `failed`, not `planning`.
- [x] **AC-57** (standing: background agent run) — While the run is going, the plan page shows a planning state and moves to the result on its own (refetch/poll) — no manual reload needed.
- [x] **AC-58** (standing: background agent run) — A run that errors or times out ends as `failed` with a reason the traveller can read — never stuck in `planning`.
- [x] **AC-59** (standing: background agent run) — Starting a run on a trip that is already `planning` does not start a second, parallel run.
- [x] **AC-60** (standing: background agent run) — A re-run reads the trip as currently edited: removed items stay removed unless the agent re-adds them with a reason, edited days and notes are taken into account.

**Standing: agent output** (how the plan is shown)

- [x] **AC-61** (standing: agent output) — Every place, time and price in the plan matches a catalogue entry or the trip — each item shows its source of fact.
- [x] **AC-62** (standing: agent output) — When the catalogue has nothing that fits (a day, a constraint, a budget), the plan says so in plain words instead of showing an invented item.
- [x] **AC-63** (standing: agent output) — Preferences change the order or choice among valid options, and "why chosen" names the preference it relied on.
- [x] **AC-64** (standing: agent output) — Every item is shown with status *planned*.

## Architecture

### How it works

All data goes through two FE services, `tripsService` (create, list, get, save day, re-plan) and a knowledge-graph service (read companions for the form), using untyped `$fetch`. The trip page owns one trip store holding the loaded `TTripRes`, reset whenever a different trip id is opened. Both tabs read it, and every mutation response (`TTripRes`) replaces it, so there is no second fetch after an edit. A page composable loads the trip on entry and, while `status === 'planning'`, refetches every 3 seconds with `useIntervalFn`, stopping on `ready` or `failed`. `/trips/:tripId` (index) waits for the first load and redirects by status. Plan states come from the response alone: no `planRun` means the trip has never had a plan; `planRun` present while `status` is `planning` or `failed` means the plan on screen is the previous one. The trips list refreshes every 5 seconds while any row is `planning`.

The request form validates with `CreateTripReqSchema`. It reads the default origin from `useAuthStore().user.homeCity` and companions from `GET /api/knowledge-graph`. Pre-fill for "Change dates and try again" comes from the failed trip, passed as a `from` query param holding its id; the form loads that trip and copies its fields. Submit is disabled while in flight, so a double click can't create two trips. Pre-fill uses the trip's `companionIds`, `whatsappOptIn` and `whatsappNumber`, dropping companions no longer in the knowledge graph.

Day editing is local state on the plan page: one day at a time, with staged removals, title, day note and item notes. "Save day" sends one `PATCH /api/trips/:tripId/days/:dayId` carrying only what changed. The server checks, in one transaction, that the trip belongs to the user and isn't `planning`, and that the day and every listed item belong to that day. It then writes a sent title (sets `titleSetByTraveller` = true, or false when cleared), a sent day note, item notes and `removedAt` on removed items, and returns the full trip. Unsaved changes disable Re-plan, and a route-leave guard asks before discarding them. "Cancel" drops local state. Re-plan calls the existing `POST /replan` after a confirm modal; the 409 from an already-planning trip is shown as a toast.

The aside is derived on the FE from `planRun.exclusions` (grouped by `factId`), `unverifiedFacts`, and the items' `citedFacts` (kind `preference` only). Nothing is computed beyond grouping and counting.

**Planning-core changes.** When a run finishes, it now also: copies `kind`, `domain` and the subject's name (or "Everyone") onto each exclusion and cited fact, so they survive fact deletion; and carries item notes over. A note follows the new item with the same `catalogueEntryId` (first match by date). If none exists, it is appended to its old day's note as "Note on <name>: <note>". `getTrip` adds `planRun` (the latest `succeeded` run), `companionIds`, `whatsappOptIn` and `whatsappNumber`. Gaps render from `gaps` by date. The UI kit's plan components switch from `IPlanItem` to the `TTripRes` item type.

### Screen layout

Placement follows the design canvas boards **Conversation** and **Plan**.

- **Request page (`/`)** — one column: "Where are you going?" heading and intro, then the request form card (Destination, Starting from, start/end dates, Who's going with "Edit people in your profile", Notes for the planner, WhatsApp number, opt-in, "Plan my trip", "The planner never books or pays for anything."). · `UForm` + `UFormField`, `CitySelect`, Nuxt UI inputs and date fields, `UCheckbox`, `UButton`.
- **Trip header (both tabs)** — status badge, destination as the title, then dates, travellers and origin. The "Re-plan with my changes" button sits on the right of the title row (Plan tab, ready/failed only). The Conversation | Plan tabs come next · `TripStatusBadge`, `UNavigationMenu` (existing), `UButton`, `AppConfirmModal`.
- **Conversation tab** — left: "Your request" summary card. Right: the conversation card with messages, the planning status line, the ready bubble with "Open the plan", and the failed bubble with "Try again" · `ChatBubble`, `PlanningStatus`.
- **Plan tab** — the "Nothing booked" notice. Then the state block: the first-run "still working" card, the re-plan banner, or the failed card with its three actions. Then two columns. Main: days, each with a header (Day n, date, title, "Edit day"), the saved confirmation, the item timeline with gap rows, the day note, and the edit-mode fields with Save day / Cancel. Aside: Rules applied (with Couldn't check), Preferences used, Where the facts come from · `NothingBookedNotice`, `PlanDay`, `PlanTrailItem`, `PlanItemCard`, `PlanItemMarker`, `PlanDayNote`, `MissingFact`, `PlanningStatus`.
- **Trips list (`/trips`)** — heading "Your trips" with a "Plan a trip" button, then rows (destination, dates, status badge) or the empty state · `TripStatusBadge`, `UEmpty` (existing).

### Schema changes

No new columns: the edits write existing `trip_days.title`, `note`, `titleSetByTraveller` and `trip_items.note`, `removedAt`. Two JSON shapes gain fields, typed in Drizzle with `$type`, with no migration needed:

- `trip_runs.exclusions[]` — adds `factKind: EPreferenceKind`, `factDomain: EPreferenceDomain`, `subjectName: string` ("Everyone" for the party).
- `trip_items.citedFacts[]` — `{ id, value }` becomes `{ id, value, kind, domain, subjectName }`.

Rows written before this change lack the fields. Run `pnpm db:reset` locally; nothing is deployed yet.

### API contract

```ts
// GET /api/trips — the signed-in user's trips, newest first
TripsListResSchema = z.array(z.object({
  id: z.uuid(),
  destination: CitySchema,
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  status: z.enum(ETripStatus),
  createdAt: z.iso.datetime()
}))

// PATCH /api/trips/:tripId/days/:dayId — "Save day": what changed, in one request
// params: TripDayParamsReqSchema = { tripId: z.uuid(), dayId: z.uuid() }
UpdateTripDayReqSchema = z.object({
  title: z.string().trim().max(200).nullable().optional(),   // omitted = unchanged; null/'' = untitled (flag false); text = flag true
  note: z.string().trim().max(1000).nullable().optional(),   // omitted = unchanged
  removedItemIds: z.array(z.uuid()).default([]),         // items of this day to mark removed
  itemNotes: z.array(z.object({
    itemId: z.uuid(),
    note: z.string().trim().max(500).nullable()
  })).default([])
})
// 200 → TripResSchema (full trip, as GET /api/trips/:tripId)
// 404 → trip not the user's, day not in trip, or any item not in this day
// 409 → trip is planning: "This trip is being planned. You can edit it when planning finishes."

// TripResSchema — additions (every endpoint returning a trip)
TripResSchema = TripResSchema.extend({
  companionIds: z.array(z.uuid()),
  whatsappOptIn: z.boolean(),
  whatsappNumber: z.string().nullable(),            // null unless opted in
  planRun: z.object({                               // run that produced the items on screen; null = never planned
    id: z.uuid(),
    finishedAt: z.iso.datetime(),
    exclusions: z.array(z.object({ ref, name, factId, factValue, factKind, factDomain, subjectName, reason }))
  }).nullable()
})
// items[].citedFacts: Array<{ id, value, kind: EPreferenceKind, domain: EPreferenceDomain, subjectName: string }>
// latestRun.exclusions gains the same factKind / factDomain / subjectName
// (written as .extend here for brevity; the build lists fields explicitly per the Res-schema rule)

// Existing, otherwise consumed as is:
// POST /api/trips (CreateTripReqSchema → TripResSchema, 201)
// GET  /api/trips/:tripId (TripResSchema)
// POST /api/trips/:tripId/replan (TripResSchema; 409 when planning)
// GET  /api/knowledge-graph (KnowledgeGraphResSchema — person nodes with role 'companion')
```

### Reuse — do not reimplement

- `CreateTripReqSchema`, `TripResSchema`/`TTripRes`, `TripParamsReqSchema`, enums `ETripStatus`, `EItemKind`, `EGapReason`, `EMessageAuthor`, `EMessageKind`, `ERunStatus` (`shared/schemas/trips/`); `KnowledgeGraphResSchema` (`shared/schemas/knowledge-graph/`); `CitySchema` (`shared/schemas/cities/`); `MAX_TRIP_DAYS`, `ACK_MESSAGE` (`shared/constants/trips.ts`).
- `createTrip`, `getTrip`, `replanTrip` controllers and their routes (`server/controllers/trips/`, `server/api/trips/`); `tripsRepo.findTripById(userId, tripId)` and the trip repos (`server/repos/`); `createUserError` (`server/utils/errorUtils.ts`).
- `CitySelect`, `NothingBookedNotice`, `AppConfirmModal` (`app/components/`); `ChatBubble` (`components/chat/`); `PlanDay`, `PlanTrailItem`, `PlanItemMarker`, `PlanItemCard`, `PlanDayNote`, `MissingFact`, `PlanningStatus`, `TripStatusBadge` (`components/trip/`).
- `useModals` (`app/features/platform/modals/`), `Icon` / `TIcons` (`app/features/platform/icons/`), `useAuthStore` (`app/store/auth.store.ts`), `useAuthErrorMessage` pattern for reading `FetchError.data.message` (`app/composables/`), `citiesService` (`app/services/`).
- The trip tab shell `app/pages/trips/[tripId].vue` and routes `trips-tripId-conversation`, `trips-tripId-plan`.
- `read_trip` (`server/controllers/shared/planning/buildPlanningTools.ts`) already passes titles, notes and removed flags to the agent. No agent change.

## Key decisions

- **The design canvas is the layout source, with one change**: `/` shows only the form. The design's empty conversation panel is dropped, because it never fills on that page. The conversation, with the request summary beside it, lives at `/trips/:id/conversation`.
- **Edit scope**: day title, day note, item removal and item notes. Times and order stay the agent's, so every time shown is one code has checked.
- **One request per "Save day"**: it matches the design's edit mode, with Cancel instead of a confirm modal for removals.
- **Edits never start a run**: a manual "Re-plan with my changes", with a confirm.
- **During a re-plan the old plan stays visible and read-only**, and a failed re-plan keeps it, labelled "Showing your previous plan".
- **The aside is built only from stored data**: exclusions, unverified facts and cited facts, so it shows no ranking claims.
- **Polling every 3 seconds while planning**, shared by both tabs through one page store.
- **Mutation responses return the full trip**, replacing the store, so there's no refetch after an edit.
- **The nav stays as shipped**, with a trips list. The design's Trip/Plan nav is a one-trip prototype.
- **Item notes survive re-plans**: they follow the same catalogue entry, or move into the day note. A traveller's words are never lost.
- **The trip response says which run made the plan** (`planRun`), so the page never has to guess first-run vs re-plan, or which exclusions to show.
- **Only changed fields are sent on Save day**, so an untouched agent title stays the agent's.
- **Server messages are shown verbatim**: the canonical acknowledgement from the core plan wins over the design's sample text.

## Non-goals

- Editing item times, order or moving items between days, which takes a re-plan instead.
- Restoring a removed item from the UI.
- A server-side guard against duplicate trips from two tabs. AC "Submitting twice quickly…" is met by disabling submit while the request is in flight.
- Sending WhatsApp messages (Twilio plan). The opt-in and number are only collected here.
- The profile screen ("Review your rules" links to the existing `/profile` page).
- From the standing *table / list* block: "Every column marked sortable actually sorts" and "Search/filters … visibly reduce the row set" are dropped, because the trips list has no sorting or filters. "Destructive ones ask for confirmation first" (AC-40) is met by the day edit's Cancel + Save rather than a per-item confirm. That's a deliberate reading per the design.
- From the standing *multi-step flow* block: "Advancing is gated on the current step being complete" and "Going back preserves everything entered" are dropped. The flow is one form plus server-driven states with no back step, and the form's own gating is covered by AC-44.
- From the standing *agent output* block: "No item violates a hard constraint…" and "'Why chosen' never cites a preference the knowledge graph doesn't contain" are dropped. Both are enforced by the planning core (its AC-40, AC-42 in `plans/planning-core.md`) and are unaffected by display.

## Blockers & dependencies

- **Depends on** `plans/planning-core.md` (implemented, not yet committed). This plan uses its trip API, the `read_trip` handling of edits and the replan endpoint, and changes its finish step and trip response, as described under Planning-core changes.

## Decisions taken

- **Day-edit draft lives in the page's trip store, not plan-page local state** — the header's "Re-plan with my changes" must see unsaved changes to disable itself; save state (saving, error, saved day) sits beside it (AC-20, AC-24)
- **Unsaved-day guard: in-app navigation opens `AppConfirmModal` "Discard changes to Day n?"; closing or reloading the tab uses the browser's own `beforeunload` prompt** — browsers don't allow custom text there (AC-24)
- **Save day locks the trip row (`SELECT … FOR UPDATE`) before the planning check** — a re-plan can't flip the trip between the check and the writes, so the next run always reads the saved day (AC-31)
- **An item note on a removed item stays on that removed row; only live items' notes are carried** — the traveller removed it on purpose, and removed rows survive re-plans (AC-17)
- **Two old notes on the same catalogue entry go to distinct new items in order; one without a match goes to the day note** — no note overwrites another (AC-17)
- **`unverifiedFacts` now comes from `planRun` when there is one** (else the started run, as before) — the aside describes the run that produced the plan on screen, also during a re-plan (AC-18)
- **Subject names for exclusions and cited facts are resolved by `splitRunFacts(facts, names)` (on `IRunFacts`)** — every place that builds them already holds the run facts, so no new plumbing; gap facts copy theirs from the exclusions (planning core)
- **A place gap reads "Food place" only when a food-domain rule removed the options; otherwise "Place"** — gaps store only the item kind, and a place gap can also mean "too few places" (AC-15)
- **Dates use `UInput type="date"`, not `UInputDate`** — yields the ISO strings `CreateTripReqSchema` takes, no CalendarDate conversion (AC-4)
- **Empty WhatsApp number and notes are sent as `null`** — the schema's number regex would reject `''` while opted out (AC-4, AC-43)
- **"Re-plan with my changes" also shows on a failed trip that has a previous plan; hidden on a failed first run** — that one has nothing to re-plan from, and its "Try again" sits in the failed card (AC-26, AC-29)
- **The created trip seeds the trip store before navigating** — the conversation renders the request and acknowledgement without a loading state (AC-5, AC-55)
- **A failed poll shows one toast per streak of failures, then keeps polling** — surfaced, not swallowed, without a toast every 3 s (AC-34, AC-35)
- **Malformed trip/day ids get a readable Zod message ("This trip link isn't valid."), and `getErrorMessage` reads the first Zod issue from h3's 400 body** — h3 puts the issues' JSON in `message` (AC-53)
- **Gaps not tied to a day render above Day 1 with the same wording as day gaps** (`formatGap` in `app/utils/tripFormat.ts`) (AC-15)
- **`PlanItemCard` dropped the "Time not in catalogue" branch** — every item in `TTripRes` has a catalogue time (AC-14)
- **Review round 1 (UI feedback):** From and To are separate `UInputDate` fields, each with a `UCalendar` in a popover (`TripDateInput`); To can't be set before From; "Starting from" comes before "Destination"; the form column is centered. The companions skeleton is gone because it caused a jump on reload. The site header and the trip header + tabs stay fixed while the content scrolls. The "nothing booked" notice shows only over a settled plan. A first run shows a centered planning animation instead of a card. "No stored preference applied" is hidden from item cards. Save/Cancel also sit in the day header. "Save day" confirms with a toast carrying "Re-plan with my changes" instead of the inline line (AC-22's wording is in the toast) (AC-13, AC-20, AC-22, AC-27)
- **Re-plans are worded as re-plans** — a separate ack, ready and failed message when an earlier run succeeded; a retry after a failed first run keeps the first-plan wording (AC-10, AC-12)
- **Planning respects the traveller's "now"** — the request carries the browser's IANA time zone (new `trips.time_zone`, migration `0002_trip_time_zone`). Start dates are validated against the traveller's own "today". On a same-day trip nothing but the stay starts within the next hour. A trip that has already started can't be (re-)planned (AC-58, planning core)

## Verify

Runs last, after every build slice is done.

An orchestrator session: a fresh sub-agent drives the **entire** `## Acceptance criteria` list in a browser against the local stack, blind to the diff; a second reviews the whole branch; then one fix agent per finding. Findings are appended below before anything is fixed.

### Findings

_(populated during verify)_

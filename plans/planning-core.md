# Plan: Planning core — knowledge graph, catalogue, trip model, background agent

_Refs: client brief (PoC Travel Planning PDF) · `server/services/agent/agent.service.ts` · `server/services/drizzle/schema.ts` (`usersTable`) · no prior `plans/*.md`_

## Overview

The heart of the system, API-only: the traveller's knowledge graph (people + free-text constraints and preferences, each turned into a code-checkable rule on save), a fixture catalogue, the stored trip, and a background Deep Agents run on a durable Postgres job queue that plans the trip from them — deployed on Fly. The guarantees (constraints remove options, every fact is grounded, nothing is booked, a run never hangs in `planning`) are enforced by code, not by the prompt.

## Acceptance criteria

Each criterion states a rule that must hold for **any** user, trip and catalogue data. The `Check:` line is one concrete way to verify it on the local stack: API calls with the seeded user's session (`olena@local.test` / `password123`), plus the local database. The seed scenarios it uses are listed under `## Architecture → Seed`. "The Lisbon request" = `POST /api/trips` Warsaw → Lisbon, 2026-11-12 → 2026-11-15, companion Taras.

**Knowledge graph**

- [x] **AC-1** — `GET /api/knowledge-graph` returns one node for the traveller (named after the user's full name), one per companion, one for the party, and one per fact, with edges linking each person to the party and each fact to its subject.
  _Check:_ the seeded user returns Olena Kovalenko, Taras, the party and the seeded facts.
- [x] **AC-2** — Saving a hard constraint whose meaning can be expressed with catalogue fields returns `ruleStatus: 'compiled'` and a `ruleSummary` sentence saying what it removes.
  _Check:_ "No red-eye flights" (transport) returns something like "Removes flights departing 22:00–05:59".
- [x] **AC-3** — Saving a fact the catalogue has no field for succeeds with `ruleStatus: 'unenforceable'` and a `ruleNote` saying which information is missing.
  _Check:_ "No hotels near the airport" (stay).
- [x] **AC-4** — Editing a fact's text recompiles it in the same request: the returned `ruleSummary` matches the new text.
- [x] **AC-5** — If the rule step fails, the save returns an error with a readable `message`, and no fact row is created or changed.
  _Check:_ set an invalid model key and save a fact.
- [x] **AC-6** — A fact's rule only affects catalogue entries of its own domain: `food` facts only food places, `stay` facts only stays, `transport` facts only transport.
- [x] **AC-7** — Companions can be added and removed. Removing one deletes the facts whose subject they were. Removing a companion who is on any trip returns 409 with a message.
- [x] **AC-8** — A user never sees or changes another user's people, facts or trips (404).
  _Check:_ sign up a second user and request the first user's ids.

**Trip request**

- [x] **AC-9** — A trip request returns within 2 seconds with `status: 'planning'`, one day per date from start to end (inclusive, in order), and a conversation made of the traveller's request (built from the form fields and notes) followed by this agent message, word for word: "I'll plan this trip and come back to you. I won't book or charge anything while you're away."
  _Check:_ the Lisbon request returns 4 days, 12–15 Nov.
- [x] **AC-10** — A request without an origin or destination is rejected (400). A request whose end date is before its start date, or that spans more than 14 days, is rejected (400) with a message naming the field. The traveller is always on the trip, whether or not they're listed.
- [x] **AC-11** — Opting in to WhatsApp without a number is rejected (400). Without opt-in, the number is not stored.
- [x] **AC-12** — The request's notes are stored on the trip and passed to the agent, and never become a fact in the knowledge graph.
  _Check:_ "Slow mornings please" appears in the trip and in the agent's `read_trip` result, and the knowledge graph is unchanged.

**Agent output**

- [x] **AC-13** — Every `ready` plan starts day 1 with transport from the trip's origin to its destination and ends the last day with transport back; has one stay covering every night; and has 2–4 places per day including at least one food place. Anything missing is listed as a gap.
  _Check:_ the Lisbon request.
- [x] **AC-14** — Every item's name, price and times equal those of the catalogue entry its `source` names. An entry without a price gives `price: null`, never an estimate.
  _Check:_ compare the Lisbon plan's items with `catalogue_entries`; the seeded entry without a price.
- [x] **AC-15** — No item fails a compiled hard constraint that applies to the trip. Every catalogue entry removed by such a constraint is listed in `latestRun.exclusions`, together with that constraint.
  _Check:_ with "No red-eye flights" stored, the Lisbon plan has no transport departing 22:00–05:59, and the seeded red-eye flights are in `exclusions`.
- [x] **AC-16** — A person's facts apply to a trip only when that person is on it; when they are, they apply to every item on the trip.
  _Check:_ add the hard constraint "Vegetarian" for Taras. A trip with Taras has only vegetarian-tagged food places; the same trip without Taras ignores the constraint.
- [x] **AC-17** — An item whose `why` relies on a stored preference lists it in `citedFacts`, and the item really matches that preference's rule. With no matching preference, `why` says no stored preference applied, or quotes the trip notes.
  _Check:_ with "Direct flights" stored, a flight citing it has `stops: 0`.
- [x] **AC-18** — A place in a city other than the destination appears only on a day that also has transport to that city.
  _Check:_ a Sintra place in the Lisbon plan appears on the same day as the Lisbon → Sintra train.
- [x] **AC-19** — When the catalogue has no transport for a leg, the plan is `ready` and that leg is listed as a gap; no transport is invented.
  _Check:_ a trip from Kraków (no catalogue rows) to Lisbon has gaps for both transport legs.
- [x] **AC-20** — Every unenforceable fact that applies to the trip is listed in `unverifiedFacts`.
- [x] **AC-21** — The last agent message says whether the plan is ready or failed, with the reason when it failed. It contains no place names, prices or times.
- [x] **AC-22** — Deleting a fact cited by a finished plan leaves the trip readable, still showing the cited fact's text.

**Failure paths**

- [x] **AC-23** — A trip to a destination with no catalogue entries ends `failed`, with a `failureReason` saying the destination has no catalogue options, and has no items.
  _Check:_ a trip to Reykjavik (seeded with no rows).
- [x] **AC-24** — When the hard constraints remove every stay at the destination, the run ends `failed` with a reason saying no stay fits.
  _Check:_ "Hotels under €20 a night" on the Lisbon request.
- [x] **AC-25** — A run interrupted by a server crash or restart continues within 1 minute of the server starting again, and the trip still ends `ready` or `failed`.
  _Check:_ stop the dev server mid-run and start it again.
- [x] **AC-26** — A run that exceeds the time limit ends `failed` with the reason "Planning took too long", and is not retried.
  _Check:_ `NUXT_AGENT_RUN_TIMEOUT_SECONDS=5`.

**Re-run**

- [x] **AC-27** — Re-planning a `ready` or `failed` trip returns `status: 'planning'`, still showing the previous days and items. Re-planning a trip that is already `planning` returns 409, and no second run starts.
- [x] **AC-28** — A re-plan that succeeds replaces the plan's items in one step. One that fails keeps the previous items and shows `status: 'failed'` with the reason.
- [x] **AC-29** — An item the traveller removed doesn't come back after a re-plan unless it's flagged as re-added, with a reason in `why`. Day titles and notes the traveller set are unchanged by a re-plan.
  _Check:_ set `removedAt` on an item in the database (the edit endpoints are a later plan), then re-plan.

**Deploy**

- [x] **AC-30** — Each push to `stage` deploys to Fly. On the deployed app, `GET /api/health` reports the database connected, and a trip request finishes `ready` or `failed` with no browser open.
  _Check:_ the Lisbon request on the Fly URL.

**Load**

- [x] **AC-31** — Trip requests return within 2 seconds however many runs are queued or in progress. No more than `agentWorkerConcurrency` runs are `running` at once; the rest wait `queued`. Every trip ends `ready` or `failed`, and reading a trip responds within 1 second while runs are in progress.
  _Check:_ send 10 requests at once with `NUXT_AGENT_WORKER_CONCURRENCY=5`.

**Standing: background agent run**

- [x] **AC-32** (standing: background agent run) — Submitting the request shows the acknowledgement ("I'll plan and come back — I won't book or charge anything") in the conversation right away, before any planning has finished.
- [x] **AC-33** (standing: background agent run) — Closing the page right after submitting does not stop the run: reopening the trip later shows `ready` or `failed`, not `planning`.
- [x] **AC-34** (standing: background agent run) — A run that errors or times out ends as `failed` with a reason the traveller can read — never stuck in `planning`.
- [x] **AC-35** (standing: background agent run) — Starting a run on a trip that is already `planning` does not start a second, parallel run.
- [x] **AC-36** (standing: background agent run) — A re-run reads the trip as currently edited: removed items stay removed unless the agent re-adds them with a reason, edited days and notes are taken into account.
- [x] **AC-37** (standing: background agent run) — The agent has no tool that books, reserves, pays, or contacts a provider — and no trace of one happening appears anywhere.

**Standing: agent output**

- [x] **AC-38** (standing: agent output) — Every place, time and price in the plan matches a catalogue entry or the trip — each item shows its source of fact.
- [x] **AC-39** (standing: agent output) — When the catalogue has nothing that fits (a day, a constraint, a budget), the plan says so in plain words instead of showing an invented item.
- [x] **AC-40** (standing: agent output) — No item violates a hard constraint of the person or party it applies to — options that break one are absent, not ranked low.
- [x] **AC-41** (standing: agent output) — Preferences change the order or choice among valid options, and "why chosen" names the preference it relied on.
- [x] **AC-42** (standing: agent output) — "Why chosen" never cites a preference the knowledge graph doesn't contain; with no matching preference it says so.
- [x] **AC-43** (standing: agent output) — Every item is shown with status *planned*.

## Architecture

### How it works

**Saving a fact.** The traveller sends free text with kind, domain and subject. Outside any transaction, the controller calls `compileRule` (fast model, structured output): it either returns a rule over the fields in the shared `RULE_FIELDS` registry plus a one-sentence summary, or declares the text unenforceable with a note. The domain fixes the rule's scope (`stay` → stays, `transport` → transport, `food` → places with `category: food`). The rule is validated against the registry; one retry with the validation errors, then the save fails. One write stores text, rule and summary together. A hard constraint removes in-scope entries that fail its test; a preference marks in-scope entries that pass as matching. An in-scope entry missing the tested field fails (fail closed).

**Requesting a trip.** `POST /api/trips` writes in one short transaction: the trip (`planning`), travellers, one day row per date, the request and acknowledgement messages, and a `queued` run. After commit it sends a pg-boss job `plan-trip` with the trip id as singleton key, then responds. If sending fails, run and trip are marked `failed`.

**The run.** A pg-boss worker started with the Nitro server processes up to `agentWorkerConcurrency` jobs at once (default 5); further jobs wait `queued`, and the run timeout counts from when a run starts, not from when it was queued. The worker marks the run `running` and snapshots the facts that apply: party facts plus facts of people on this trip. Code pre-checks: no catalogue entries for the destination → `failed`; no stay survives the hard rules → `failed`. Then the controller builds four tools over repos and calls `runAgent` with the run id as `thread_id` and an abort signal:
- `read_profile` — the snapshot, with rule summaries; unenforceable facts as plain text.
- `read_trip` — origin, destination, dates, notes, days with traveller titles and notes, current items including removed ones.
- `search_catalogue({ kind, cityId, toCityId? })` — entries with hard-rule violators removed (each removal appended to the run's exclusions), each result tagged with the preference facts it matches.
- `save_plan({ days: [{ date, title?, items: [{ ref, time, why, citedFactIds, readdsRemoved? }] }], gaps: [{ kind, date?, reason }] })` — code rejects unknown refs, hard-rule failures, times outside opening hours, places in another city with no transport there that day, cited ids that aren't stored preferences or that the entry doesn't match, removed items without `readdsRemoved`, and a plan missing required pieces with no gap stated. Accepted plans are written to the run row immediately; rejections increment a counter, and the second fails the run.

**Finishing.** One short transaction replaces the trip's non-removed items and gaps (facts copied from catalogue rows; cited facts copied as `{ id, value }`), fills empty day titles from the plan, sets trip `ready` and run `succeeded`, and adds a templated "ready" message (counts only). An error, the second rejection or the timeout (`agentRunTimeoutSeconds`, default 480) sets trip `failed` with a readable reason and a templated "failed" message — previous items untouched — and completes the job, so no retry. After commit, `onRunFinished(tripId, status)` runs (empty hook for the Twilio plan). A process crash stops the job's pg-boss heartbeat (`heartbeatSeconds` 30): pg-boss fails it and the retry resumes the run from its LangGraph checkpoint; `expireInSeconds` 600 + `retryLimit` 1 + a dead-letter worker that marks the trip `failed` ("Planning stopped unexpectedly") cover anything else.

**Re-run.** `POST /api/trips/:tripId/replan` returns 409 on a `planning` trip, otherwise inserts a run and sends a job as above. A fresh thread; the edited trip reaches the agent only via `read_trip`. While `planning`, the trip is read-only: plan edits return 409.

**Hosting.** Nuxt builds with the Nitro `node-server` preset and runs on one always-on Fly machine. The queue worker runs in the web process. `NUXT_DATABASE_URL` uses a direct or session-mode Postgres connection, because pg-boss and the checkpointer need sessions the transaction pooler doesn't keep. `deploy.yml` deploys with `flyctl` and runs migrations as today.

### Schema changes

All tables in `public`, Drizzle-generated migration, plain `varchar` for enum values (validated in Zod), random UUID PKs. pg-boss owns schema `pgboss` and the checkpointer owns `langgraph`; neither is Drizzle-managed, and both are recreated on server start after `db:reset`.

- `people` — `id uuid pk`, `userId → users.id cascade`, `role varchar` (`traveller | companion`), `name varchar(100) null` (null for the traveller — the name comes from `users.fullName`), `createdAt`. Unique partial index: one `traveller` per user; created idempotently on first knowledge-graph access.
- `profile_facts` — `id uuid pk`, `userId → users cascade`, `subjectPersonId → people cascade null` (null = the party), `kind varchar` (`EPreferenceKind`), `domain varchar` (`EPreferenceDomain`), `value text`, `ruleStatus varchar` (`compiled | unenforceable`), `rule jsonb null` (`TRule`), `ruleSummary text null`, `ruleNote text null`, `createdAt`, `updatedAt`. Index `(userId)`.
- `catalogue_entries` — `id uuid pk`, `ref varchar(32) unique`, `kind varchar` (`EItemKind`), `cityId int` (GeoNames id = `TCity.id`; transport: departure city), `cityName varchar`, `name varchar`, `description text`, `priceAmount numeric(10,2) null`, `priceCurrency char(3) null`, `priceUnit varchar null` (`per_night | per_person | per_adult | free`), `attributes jsonb` (per-kind Zod union). Index `(kind, cityId)`.
- `trips` — `id uuid pk`, `userId → users cascade`, `origin jsonb` (`TCity`), `destination jsonb` (`TCity`), `startDate date`, `endDate date` (inclusive), `notes text null`, `status varchar` (`ETripStatus`), `failureReason text null`, `whatsappNumber varchar(20) null`, `whatsappOptIn boolean`, `createdAt`, `updatedAt`. Index `(userId)`.
- `trip_travellers` — `tripId → trips cascade`, `personId → people restrict`; pk `(tripId, personId)`.
- `trip_days` — `id uuid pk`, `tripId → trips cascade`, `position int`, `date date`, `title varchar null`, `note text null`, `titleSetByTraveller boolean default false`. Unique `(tripId, date)`, unique `(tripId, position)`.
- `trip_items` — `id uuid pk`, `tripId → trips cascade`, `dayId → trip_days cascade`, `position int`, `kind varchar`, `catalogueEntryId → catalogue_entries`, `source varchar` (catalogue ref), `name varchar`, `time time`, `endTime time null`, `priceAmount numeric(10,2) null`, `priceCurrency char(3) null`, `priceUnit varchar null`, `transport jsonb null` (`{ from, to, departs, arrives, arrivesNextDay }`, city names), `why text`, `citedFacts jsonb` (`[{ id, value }]`), `status varchar` (`planned`), `note text null`, `removedAt timestamptz null`. Unique `(dayId, position)`.
- `trip_gaps` — `id uuid pk`, `tripId → trips cascade`, `date date null`, `kind varchar`, `reason varchar` (`none_in_catalogue | all_excluded`), `facts jsonb` (`[{ id, value }]`).
- `trip_messages` — `id uuid pk`, `tripId → trips cascade`, `author varchar` (`traveller | agent`), `kind varchar` (`request | ack | ready | failed`), `body text`, `createdAt`.
- `trip_runs` — `id uuid pk`, `tripId → trips cascade`, `status varchar` (`queued | running | succeeded | failed`), `failureReason text null`, `draftPlan jsonb null` (last accepted `save_plan`), `rejections int default 0`, `exclusions jsonb default []` (`[{ ref, name, factId, factValue, reason }]`), `unverifiedFacts jsonb default []` (`[{ id, kind, value }]`), `startedAt null`, `finishedAt null`, `createdAt`. Index `(tripId, createdAt)`.

### Rule format (shared module)

```ts
// shared: the vocabulary the save-time model may use; also drives validation and evaluation
RULE_FIELDS = {
  transport: { mode: enum(flight|train|bus), departs: time, arrives: time, arrivesNextDay: boolean, stops: int, priceAmount: number },
  stay:      { area: string, tags: string[], priceAmount: number },
  place:     { category: enum(sight|food|activity), dietaryTags: string[], tags: string[], opensAt: time, closesAt: time, priceAmount: number }
}
DOMAIN_SCOPE = { stay: { kind: 'stay' }, transport: { kind: 'transport' }, food: { kind: 'place', where: category = 'food' } }

TRule = { scope: { kind: EItemKind, where?: TCondition }, test: TCondition }
TCondition =
  | { all: TCondition[] } | { any: TCondition[] } | { not: TCondition }
  | { field: string, op: 'eq'|'neq'|'in'|'nin'|'lt'|'lte'|'gt'|'gte'|'between'|'contains', value: unknown }
// hard constraint: in-scope entry must pass `test`, else removed
// preference: in-scope entry passing `test` matches
// missing field → test fails; time `between` wraps past midnight; times are local to the entry's city
```

`evaluateRule(rule, entry): boolean` is the only evaluator. It is used by `search_catalogue` and by `save_plan`.

### Catalogue attributes (per kind)

```ts
transport: { mode, toCityId: int, toCityName: string, departs: 'HH:mm', arrives: 'HH:mm', arrivesNextDay: boolean, stops: int, operator: string }
stay:      { area: string, tags: string[], checkIn: 'HH:mm', checkOut: 'HH:mm' }
place:     { category: 'sight'|'food'|'activity', opensAt: 'HH:mm'|null, closesAt: 'HH:mm'|null, durationMin: int|null, dietaryTags: string[], tags: string[] }
```

### API contract

Every route needs a session (`event.context.user`); every read and write is scoped by `userId`, 404 otherwise.

```ts
// GET /api/knowledge-graph
KnowledgeGraphResSchema = {
  nodes: Array<
    | { id: uuid, type: 'person', name: string, role: 'traveller' | 'companion' }
    | { id: 'party', type: 'party', name: 'Everyone' }
    | { id: uuid, type: 'fact', kind: EPreferenceKind, domain: EPreferenceDomain, value: string,
        ruleStatus: 'compiled' | 'unenforceable', ruleSummary: string | null, ruleNote: string | null }
  >,
  edges: Array<{ from: string, to: string, type: 'member_of' | 'applies_to' }>
}

// POST /api/knowledge-graph/people — add companion
CreatePersonReqSchema = { name: string(1..100) }   → PersonResSchema = { id, name, role }
// DELETE /api/knowledge-graph/people/:personId → 204; 400 for the traveller; 409 if on any trip

// POST /api/knowledge-graph/facts — runs compileRule → 204
CreateFactReqSchema = { subjectPersonId: uuid | null, kind: EPreferenceKind, domain: EPreferenceDomain, value: string(1..300) }
// DELETE /api/knowledge-graph/facts/:factId → 204
// rule step failure → 502 + message; nothing written

// POST /api/trips — create + enqueue; responds immediately
CreateTripReqSchema = {
  origin: TCity, destination: TCity,
  startDate: iso date, endDate: iso date,               // inclusive; end ≥ start; ≤ 14 days
  companionIds: uuid[],                                 // traveller always included
  notes: string(0..1000) | null,
  whatsappOptIn: boolean, whatsappNumber: E.164 | null  // required when opted in; dropped when not
}
// GET /api/trips/:tripId
// POST /api/trips/:tripId/replan — 409 when status = planning
TripResSchema = {
  id, origin: TCity, destination: TCity, startDate, endDate, notes: string | null,
  status: ETripStatus, failureReason: string | null,
  travellers: Array<{ id, name, role }>,
  days: Array<{ id, position, date, title: string | null, note: string | null,
    items: Array<{ id, position, kind: EItemKind, name, time, endTime: string | null,
      price: { amount: number, currency: string, unit: string } | null,
      transport: { from: string, to: string, departs: string, arrives: string, arrivesNextDay: boolean } | null,
      why: string, citedFacts: Array<{ id, value }>, source: string,
      status: 'planned', note: string | null }> }>,       // removed items excluded
  gaps: Array<{ date: string | null, kind: EItemKind, reason: 'none_in_catalogue' | 'all_excluded', facts: Array<{ id, value }> }>,
  unverifiedFacts: Array<{ id, kind: EPreferenceKind, value }>,
  messages: Array<{ id, author: 'traveller' | 'agent', kind: 'request' | 'ack' | 'ready' | 'failed', body, createdAt }>,
  latestRun: { id, status, failureReason: string | null, startedAt, finishedAt,
    exclusions: Array<{ ref, name, factId, factValue, reason }> } | null
}
```

Runtime config added: `ruleModel` (default `claude-haiku-5-5`), `agentRunTimeoutSeconds` (default 480), `agentWorkerConcurrency` (default 5; lower it to 2–3 on a low Anthropic usage tier).

### Seed

`supabase/seed/local.sql`, rules pre-compiled (no model call on reset). For the existing demo user Olena Kovalenko (home Warsaw):
- companion **Taras**;
- party hard constraint **"No red-eye flights"**, party preference **"Direct flights"**, Olena's preference **"Quiet, walkable neighbourhood"**.

Catalogue:
- **Lisbon**: ~3 stays, ~12 places (sights, activities, food incl. vegetarian-tagged, one with no price);
- **Warsaw ↔ Lisbon** flights both ways (direct and one-stop, at least two red-eye);
- **Lisbon ↔ Sintra** train plus 2 Sintra places.

**Reykjavik** and **Kraków** have no rows: Reykjavik as a destination checks the failed run (AC-23), Kraków as an origin checks transport gaps (AC-19). City ids are GeoNames ids, checked against the city search during the build.

### New libs / approaches

- **`pg-boss`**: a durable job queue in our Postgres (singleton per trip, expiry, retry, dead-letter). Chosen over Vercel `waitUntil` (in memory, lost on crash) and Trigger.dev/Inngest (new vendor).
- **Fly.io**: replaces Vercel. The worker needs a long-running process, and Vercel functions aren't one.
- **Rule compilation on save**: the model reads the text once, and code evaluates the rule on every run. That makes hard constraints provable.

### Reuse — do not reimplement

- `useAgentService().runAgent` (`server/services/agent/agent.service.ts`): extend it with an abort signal, resume, filesystem and sub-agents off, and add `compileRule`. Don't add a second wrapper.
- `useDrizzle()`, `TDrizzle` (`server/utils/drizzle.ts`); `buildRepos` / `repos` (`server/repos/index.ts`).
- `createUserError` (`server/utils/errorUtils.ts`) for every error the traveller should read.
- `usersTable` (`server/services/drizzle/schema.ts`) and `event.context.user` (`server/middleware/01.auth.ts`).
- `CitySchema` / `TCity` (`shared/schemas/cities/CitySchema.ts`) for origin and destination.
- `EPreferenceDomain`, `EPreferenceKind` (`shared/schemas/knowledge-graph/`); `EItemKind`, `ETripStatus` (`shared/schemas/trips/`).

## Key decisions

- **Typed Postgres tables, graph-shaped API**: the graph is two hops deep, it needs only one store, and the budget is 16 hours.
- **The party is implicit**: it means everyone on the trip, and a fact with no subject person belongs to it.
- **A person's facts apply to the whole trip when they're going**, and are ignored when they're not. The group shares every item.
- **Free-text facts, turned into a rule once on save**: the same constraint always gives the same result.
- **Unenforceable facts are saved and disclosed**: the agent gets them as text and the trip lists them in `unverifiedFacts`.
- **Missing data fails closed**: an entry missing a checked field is removed.
- **Preferences compile too, but only mark matches**: "why chosen" citations are checked against real matches.
- **Trip notes are input, not facts**: they can shape the order, but never add an item or a rule.
- **The plan is saved by catalogue ref, and code copies the facts**: the agent can't state a name, price or time the catalogue doesn't have.
- **Gaps are structured and messages templated**: no free text from the agent can carry an invented place.
- **Required shape**: transport both ways, one stay for every night, 2–4 places a day including food. Anything missing is stated as a gap.
- **Failed** means no destination options, no stay fits, error, timeout, or the plan rejected twice. Everything else is `ready`, with gaps.
- **A re-plan keeps the old plan visible and read-only** until the new one succeeds. A failed re-plan leaves it in place.
- **One pg-boss job per run, singleton per trip, resumed at boot from the checkpoint**: a trip is never stuck in `planning`.
- **A fresh agent thread per run**: the edited trip is the input.
- **Haiku for the rule step, Sonnet for planning.**
- **5 parallel runs per process, configurable** — runs mostly wait on the model, so API requests stay fast; the real ceiling is the Anthropic rate limit, not the server.
- **Catalogue cities keyed by GeoNames id**: they match trip origin and destination exactly.

## Non-goals

- **Screens:** the request form, conversation page, plan page, profile editor and plans list are separate plans. That's why the standing *any UI surface*, *form*, *table/list*, *multi-step* and *detail page* blocks aren't applied. The background-run criterion "the plan page shows a planning state and moves to the result on its own" is dropped for the same reason. Those plans use the existing UI kit components (`ProfileFactCard`, `PersonNode`, `PlanItemCard`, `MissingFact`) and replace `IPlanItem` with the `TripResSchema` item type.
- **Plan editing endpoints** (change a day, remove an item, add a note) belong to the plan-page plan. This plan only defines the columns they write (`trip_days.title/note/titleSetByTraveller`, `trip_items.note/removedAt`) and the 409 while a run is going.
- **Sending WhatsApp messages (Twilio):** the number, the opt-in and the `onRunFinished` hook are in place, and the standing *outbound WhatsApp* block belongs to that plan.
- **Budget and party-size pricing:** prices are per unit, so the "budget" case of AC-39 doesn't apply.
- **Live provider APIs and a trips list endpoint.**
- **Running more than one Fly instance, or a separate worker process.** The scaling path, not built here: run the worker as its own Fly process group so API and planning scale independently, (crash recovery already uses pg-boss heartbeats).

## Blockers & dependencies

None. Auth is committed (`0c49839`), and the seed carries the demo user.

## Decisions taken

- **Traveller `people` row is created at signup** (same tx as `users`), not lazily on first knowledge-graph access — user's call during the build; the seed inserts it for the demo user (AC-1 / knowledge graph)
- **Rule compile output carries the condition as a JSON string** (`testJson`), parsed and validated by our Zod + `RULE_FIELDS` check; a recursive schema as tool input is brittle, and we validate anyway (AC-2, AC-5)
- **Rule scope always comes from the domain** (`DOMAIN_SCOPE`), never from the model — this is what makes AC-6 hold for any text (AC-6)
- **Three-valued evaluation**: a missing field is "unknown" and stays unknown through `not`, so negated tests still fail closed (AC-15, AC-40)
- **Changing kind or domain recompiles too**, not only the text: both change what the rule means (AC-4)
- **Deleting a companion on any trip → 409 before delete** (count query), the `restrict` FK is the backstop (AC-7)
- **Exclusions are computed over every candidate at run start** (destination, both legs, one-hop excursion cities), not only what the agent searches, so `latestRun.exclusions` is complete (AC-15)
- **save_plan normalises transport/stay times to the catalogue** (departs, check-in) instead of rejecting a mismatched time; only a place's visit time is the agent's choice, checked against opening hours (AC-14)
- **Stay rule: exactly one stay, on day 1, at the destination**; a same-day trip needs none and skips the stay pre-check (AC-13, AC-24)
- **Uncited items must say "No stored preference applied"** when the trip has no notes; with notes the why is accepted as-is (quoting notes can't be checked mechanically) (AC-17)
- **Cited preferences must be compiled**: an unenforceable preference can't be cited, because a match can't be proven (AC-17, AC-42)
- **Gap `facts` are derived by code** from the run's exclusions of that kind; the agent only supplies kind/date/reason (AC-19, AC-39)
- **Item order**: by time, with the outbound leg forced first on day 1 and the way home last on the last day (a 15:00 check-in can precede a 16:45 arrival) (AC-13)
- **`trip_items (dayId, position)` uniqueness is a partial index over live items** (`removed_at is null`): removed items keep their old positions while a re-plan inserts 0..n (AC-28, AC-29)
- **Re-plan adds an ack message** to the conversation and clears the previous `failureReason` (AC-27, AC-32)
- **Queue policy `singleton`** (one active job per trip key, more may wait) + DB-level `markTripPlanning` guard for the 409; expiry `max(600, timeout + 120)` s so expiry never beats our own timeout (AC-26, AC-35)
- **Crash recovery**: queue `heartbeatSeconds` 30 — a dead process's job is failed by pg-boss (→ retry → resume from checkpoint, or → dead-letter → "Planning stopped unexpectedly"); at boot, re-send a job for any open run that has none (AC-25, AC-34)
- **Resume reuses the original `startedAt`** for the timeout; a resumed run with no checkpoint yet starts the thread fresh (AC-25, AC-26)
- **Deep Agents built-ins off via a harness profile** (`excludedTools` for the filesystem tools + `task`, general-purpose sub-agent disabled), registered for the configured model (AC-37)
- **Deadline enforced by abort signal plus a `Promise.race`**, so a layer ignoring the signal can't hold the run past the limit (AC-26)
- **Ready/failed messages are templated with counts only**; failure reasons never name a city (AC-21, AC-23)
- **Deploy**: build the image on Fly (`--build-only --push`), migrate, then deploy that image — same "broken build never touches the DB" order as before; `vercel.json` removed (AC-30)
- **Rejected plans are salvaged, not failed** (supersedes "the plan rejected twice" under Failed) — the agent gets two corrections with every error listed; a third failing save, or an agent that stops after a rejection, is repaired by code: items failing a check are left out and the missing pieces become `not_planned` gaps. Only a salvage that leaves no items fails the run. A run failed on fixable slips (place 15 min before opening, then one place used twice) (AC-13, AC-23 / save_plan)
- **Rules on `arrives` must also test `arrivesNextDay`** — `arrives` is a clock time, so "arrive before 22:00" kept a 00:23 next-day arrival; the compile prompt says so and `compileFactRule` sends such a rule back for a retry. Facts compiled before need re-saving (rule step)
- **Facts code can't check are the agent's call, not ignored** (supersedes "Cited preferences must be compiled") — `read_profile` tells the agent to judge an unenforceable fact from each result's name, description and attributes: leave out what clearly breaks a hard one, prefer and cite what clearly meets a preference. Saying nothing either way counts as not meeting it. Such a citation is stored with `checkedByCode: false` and the aside labels it as the planner's judgement. Old cited facts default to `true` (AC-17, AC-20)
- **Notes the plan doesn't follow are reported, never dropped silently** — `save_plan` takes `unmetRequests` (`{ request, reason: not_in_catalogue | excluded_by_rule | doesnt_fit }`). Code keeps only requests that quote the trip or day notes, so the plan never shows words the traveller didn't write. A misquote is sent back to the agent but never blocks a salvage. Stored in `draftPlan`, so no migration; older runs read as none. The plan page lists them above the days (e.g. "visit colosseum…": the fixture catalogue has no Colosseum in Rome)


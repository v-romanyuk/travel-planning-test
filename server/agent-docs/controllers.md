# Controllers

All business logic lives in `server/controllers/<domain>/<verb>.ts`. One method per file. Controllers orchestrate repo calls, service calls and complex calculations. Never interact with the DB directly — always go through a repo.

References: `server/repos/index.ts` for available repos

## Folder Structure

```
server/controllers/
├── trips/                      # createTrip, getTrip, listTrips, replanTrip, updateTripDay
├── knowledge-graph/            # people + facts; compileFactRule turns a fact's text into a rule
└── shared/
    └── planning/               # the agent run: queue job, tools, plan validation, finish/fail — see its README.md
```

## Hard Rules

### Multi-step DB work in transaction

Wrap multi-step DB writes in `useDrizzle().transaction(async tx => …)` at controller level. Use `buildRepos(tx)` for every repo call inside.

```ts
await useDrizzle().transaction(async (tx) => {
  const txRepos = buildRepos(tx)
  await txRepos.tripItemsRepo.deleteTripItemsByTripId(tripId)
  const days = await txRepos.tripDaysRepo.insertTripDays(plan.days)
  await txRepos.tripItemsRepo.insertTripItems(plan.items(days))
  return txRepos.tripsRepo.updateTripStatus(tripId, ETripStatus.READY)
})
```

### No 3rd-party API inside transaction

Inside `useDrizzle().transaction(...)` only DB ops are allowed. Never call external services (the agent / model provider, Twilio, HTTP, `$fetch`) from inside a transaction — unbounded latency, ties up DB connections and row locks. An agent run takes seconds to minutes; it must never hold a tx open.

Pattern: API call BEFORE tx (if its result is needed for DB writes) or AFTER tx commits (side effect — the WhatsApp message). For the agent run:

1. tx (short): mark the trip `planning`, insert the acknowledgement message
2. run the agent outside any tx — tools do their own single-query reads
3. tx (short): write days + items, set `ready` (or `failed` with the reason)
4. after commit: send the WhatsApp message if opted in. A failed send is logged, the trip status stays

### Background runs

- The run must not depend on the HTTP response or the open page. The route returns as soon as step 1 commits and the job is sent (`enqueuePlanRun`); the pg-boss worker runs it
- Every exit path of a run sets a terminal status. Wrap the run so a thrown error or timeout writes `failed` — a trip stuck in `planning` is a bug
- One run per trip: starting a run on a trip already `planning` is rejected (409) or deduped, never run twice in parallel

### Agent tools are built here

The controller builds the agent's tools as functions over repos (read knowledge graph, search catalogue, write plan) and passes them to the agent service. The service stays free of DB access. Tool outputs are what the plan may cite — keep the source of each fact so it can be stored on the item.

### No cross-domain controller imports

Controllers in `controllers/<domain>/` must never import from another domain's folder. Shared logic moves to `server/controllers/shared/`. Same-domain imports are fine (e.g. `getTrip` from `replanTrip` inside `controllers/trips/`).

If a 2nd caller appears in a different domain → move helper to `controllers/shared/` and update both call sites.

### Tx scope when delegating

When delegating to another controller, accept the trade-off: the delegated controller opens its own tx. Source-of-truth reads can sit outside the inner tx if read-only.

### Date handling

- `timestamp()` columns → `z.date()` in server-internal schemas (Drizzle returns JS Date, required for insert type compatibility)
- `date()` columns (trip start/end, day date) → `z.iso.date()` (YYYY-MM-DD string)
- Never `z.coerce.string()` for internal DB types — breaks Drizzle insert typings
- At API boundary (`shared/schemas/*ResSchema.ts`) serialize Date → ISO string via `.transform()` or explicit conversion in controller before `ResSchema.parse()`

### Ownership

Controllers receive the caller's `userId` plus ids (`tripId`, `dayId`, `itemId`) from the route handler, load the trip scoped by owner, and 404 when it — or a child that must belong to it — is missing. Never return 403 for someone else's trip: a 404 doesn't confirm it exists.

### Don't reshape data unnecessarily

Don't `.map()` repo results to rename or restructure fields. Return what the repo returns. Shaping is handled by Zod response schemas at the route boundary.

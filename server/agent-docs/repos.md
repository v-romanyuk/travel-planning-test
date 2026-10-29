# Repos

Repositories are the ONLY layer that interacts with the database. Drizzle ORM only. Organized by table. Aggregated in `server/repos/index.ts` (empty `buildRepos` today).

References: `server/services/drizzle/schema.ts` for the schema

## Hard Rules

### One method = one query

A repo method must issue exactly one DB query. Logic that needs delete-then-insert, splitting reads, or branching across queries is **orchestration** — belongs in a controller (inside `useDrizzle().transaction(...)`).

Bad (mixed ops, hidden by the method name):
```ts
async replaceDayItems (dayId, items) {
  await db.delete(tripItemsTable).where(eq(tripItemsTable.dayId, dayId))
  if (items.length === 0) return
  await db.insert(tripItemsTable).values(items)
}
```

Good (split — each one query):
```ts
async deleteTripItemsByDayId (dayId) {
  await db.delete(tripItemsTable).where(eq(tripItemsTable.dayId, dayId))
}

async insertTripItems (items) {
  if (items.length === 0) return []
  return db.insert(tripItemsTable).values(items).returning()
}
```

Empty-array guard inside a single-purpose method is OK — protects Drizzle from `.values([])` crash.

### Empty-update guard

`drizzle.update().set({})` crashes with "No values to set". When a repo builds a partial update object:

```ts
if (Object.keys(update).length === 0) return findTripDayById(id)
```

Refetch and return so caller always gets the same shape.

### Selecting columns

For a single-table fetch of all columns, use bare `.select()` — it returns every column of the FROM target:

```ts
.select().from(tripsTable)
```

Use an explicit column map only when joining and projecting fields from multiple tables, narrowing to a subset, or adding computed columns. In those cases, spread `getTableColumns(table)` rather than enumerating columns by hand:

```ts
.select({ ...getTableColumns(tripItemsTable), dayPosition: tripDaysTable.position })
```

### Method names include entity

`findAllTripDays` not `findAll`. `findTripItemsByTripId` not `findByTripId`. Globally searchable.

### Repo type independence

Repos must never import request/response schemas from `shared/schemas/`. Repo parameter and return types live in `server/types/`. If a repo needs a filter type, define it in the repo's interface file.

### Repo as factory + global `repos` object

Each repo file at `server/repos/<name>.repo.ts` exports a factory function typed by its interface in `server/types/repos/I<RepoName>.ts`:

```ts
// server/types/repos/ITripsRepo.ts (illustrative — planned)
export interface ITripsRepo {
  findTripById: (tripId: string) => Promise<TTrip | undefined>
}

// server/repos/trips.repo.ts
export const tripsRepo = (db: TDrizzle): ITripsRepo => ({
  async findTripById (tripId) {
    const [row] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId)).limit(1)
    return row ? TripSchema.parse(row) : undefined
  }
})
```

`server/repos/index.ts` assembles a global `repos` object (lazy via Proxy so `useDrizzle()` runs on first use) and exposes a `buildRepos(db)` for transaction scope:

```ts
export const buildRepos = (db: TDrizzle) => ({
  tripsRepo: tripsRepo(db),
  tripDaysRepo: tripDaysRepo(db),
  // …
})

export const repos: TRepos = new Proxy({} as TRepos, {
  get (_target, prop: string) {
    cached ??= buildRepos(useDrizzle())
    return cached[prop as keyof TRepos]
  }
})
```

**Consumers** — controllers (and the agent tools a controller builds) import the global `repos`:

```ts
import { repos } from '~~/server/repos'

export const getKnowledgeGraph = () => repos.preferencesRepo.findAllPreferences()
```

**Transactions** — inside `useDrizzle().transaction(async tx => ...)` use `buildRepos(tx)` to get a tx-scoped repos object:

```ts
const trip = await useDrizzle().transaction(async (tx) => {
  const txRepos = buildRepos(tx)
  await txRepos.tripItemsRepo.insertTripItems(items)
  return txRepos.tripsRepo.updateTripStatus(tripId, ETripStatus.READY)
})
```

Individual methods do **not** accept `tx` as an argument; the whole repo binds to whatever `db` the factory was invoked with. A specific method may accept `tx` only in the rare case it needs to mix scopes — not by default.

### No type annotations on repo args

Interface already provides them. Don't write `async findTripItems(filters: TTripItemsFilter)` — write `async findTripItems(filters)` and let TS infer from the interface.

### Delete / Update returns count or row

Never fetch-then-modify (2 calls). Delete returns deleted-row count (`.returning().length`). Update returns updated row or `undefined` (`.returning()[0]`). Controller checks count/undefined → 404. Scope child mutations by the parent too (`and(eq(tripItemsTable.id, itemId), eq(tripItemsTable.tripId, tripId))`) so an id from another trip can't be touched.

### Batch reads, never `Promise.all` per id

Never `Promise.all(ids.map(id => repo.getById(id)))` — N round-trips. Add a batch method (`findCatalogueEntriesByIds`) using `inArray(...)`. Same applies to 3rd-party APIs (Twilio) — bulk endpoint or sequential `for...of` with early `return`.

### Drizzle helpers over raw SQL

Always prefer `eq`, `and`, `or`, `gte`, `inArray`, `count`, `sum`, `ilike`. Reach for `sql\`…\`` only when no built-in fits (e.g., `COALESCE`).

`sum(col)` returns `string | null`. Wrap in `sql<string>\`COALESCE(${sum(col)}, 0)\`` or accept null in TS (`Number(row.total ?? 0)`). Pick one per call site.

`count` = number of rows. `sum` = numeric aggregate. Don't swap.

### Mutation returns full row

Insert/update repo methods must return the complete row the controller needs — controllers must never chain a separate read after a write.

### Parse return data through the entity schema

Every method that returns row data MUST parse it through its entity Zod schema before returning:

```ts
return row ? TripSchema.parse(row) : undefined         // single
return TripItemSchema.array().parse(rows)              // list
```

Catches DB drift and `.$type<...>()` mismatches at the repo boundary so callers can trust the type unconditionally. Skip parsing only for scalar aggregates (`number` from a COUNT, `boolean` from EXISTS, etc.) where there's no entity to validate.

### Register new repos

New repo files must be added to `buildRepos` in `server/repos/index.ts` so they're available via the shared accessor.

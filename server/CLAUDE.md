## Project Overview

**Trip Planner backend** — Nuxt server (Nitro / H3) exposing a typed REST API at `/api/*`. Owns all business logic, transactional database writes, the background planning-agent run, and the outbound WhatsApp notification.

## Tech Stack

- **Nuxt 4 server (Nitro/H3)** — file-based routes under `server/api/`
- **Drizzle ORM** for type-safe PostgreSQL queries (`node-postgres` / `pg` driver; local Supabase CLI Postgres)
- **Zod v4** for request/response validation at the API boundary
- **LangGraph Deep Agents** (`deepagents`, JS) for the planning agent, behind `server/services/agent/`
- **pg-boss** durable job queue (schema `pgboss`), behind `server/services/queue/`; the worker starts with the server (`server/plugins/planning-worker.ts`)
- **Twilio** (WhatsApp sandbox) for the "plan is ready / failed" message, behind `server/services/twilio/`
- **pnpm** as the package manager

Supabase Auth (email + password) via `@nuxtjs/supabase`; `server/middleware/01.auth.ts` verifies the session cookie and sets `event.context.user`. Data access is Postgres via Drizzle only — the Supabase client is used for auth, never `.from(...)`.

## Development Patterns

### Layered Architecture

Strict one-way dependency direction:

```
route handler → controller → repo → database
route handler → schema (Zod validation)
controller → (repo | service | useDrizzle().transaction)
```

- **Route handler** (`server/api/`) — HTTP boundary. Parse + validate input, delegate to controller, validate + return response. Zero business logic. Never touches the database
- **Controller** (`server/controllers/<domain>/<verb>.ts`) — business logic, one method per file. Owns `useDrizzle().transaction(...)` for multi-step writes. Never accesses the DB directly — only via repos
- **Repo** (`server/repos/<entity>.repo.ts`) — Drizzle queries, one method = one query. Aggregated via `repos/index.ts`
- **Service** (`server/services/<provider>/`) — thin wrappers around 3rd parties (`twilio` for WhatsApp, `agent` for Deep Agents + the model provider). Provider-agnostic params, no business logic inside, no DB access

### Domain

- **Trip** — `trips` (origin, destination, start, end, status `planning | ready | failed`, WhatsApp number + opt-in), ordered `days`, `items` (kind `stay | place | transport`, name, time, transport from/to/arrival, why chosen, source of fact, status `planned`, note), conversation `messages`
- **Knowledge graph** — separate tables, not columns on the trip: people (traveller + companions; traveller has a home city (`users.home_city`) that seeds a new trip's origin), preferences and hard constraints (subject = person or party, domain `stay | food | transport`, value)
- **Fixture catalogue** — `catalogue_entries` (stays, places, transport; keyed by GeoNames city id) the agent searches through tools. Never live provider APIs
- **Rules** — each fact's free text is compiled once on save into a rule over `RULE_FIELDS` (`shared/constants/ruleFields.ts`); `server/utils/rules/evaluateRule.ts` is the only evaluator

### Agent Run

- `POST /api/trips` persists the trip + the acknowledgement message ("I'll plan and come back — I won't book or charge anything") and responds immediately. After commit the controller sends a pg-boss job; the worker in the same long-running process picks it up, so the run finishes even if the page is closed. Lifecycle, invariants and crash recovery: `server/controllers/shared/planning/README.md`
- The controller hands the agent service its **tools** (read knowledge graph, search catalogue, write plan) as functions backed by repos. The agent service never imports repos or Drizzle
- Every place, time and price written into the plan comes from a tool result or the trip; each item records its source of fact. Missing data is stated, never invented. Hard constraints filter, preferences rank, preferences are never made up
- The run ends by setting `ready` or `failed` — a thrown error, timeout or ungrounded output ends as `failed` with a reason, never stuck in `planning`. Only one run per trip at a time
- After the terminal status is committed, send the WhatsApp message (only if opted in) with a link built from `useRuntimeConfig().public.appUrl`. A failed send is logged and does not change the trip status. Each run records its outcome (`trip_runs.notification_status`); see the planning README
- A re-run reads the trip as currently edited by the traveller

### Schema Boundaries

- **Cross-boundary** Zod schemas, enums, and interfaces → `shared/schemas/<domain>/` (one schema/enum per file). Imported by both FE services and server route handlers
- **Server-only** schemas (used in ≥2 server files) → `server/types/<domain>/`. Single-file types stay inline (no `export`)
- Request schemas: `*ReqSchema`. Response schemas: `*ResSchema`. Enums prefixed `E`, type aliases prefixed `T`, interfaces prefixed `I`
- Agent tool input/output schemas are server-only → `server/types/agent/` (they are not part of the HTTP API)

### Transactions

- Multi-step writes wrapped in `useDrizzle().transaction(async tx => { ... })` at the controller level. Use `buildRepos(tx)` for every repo call inside
- **No external API calls inside a transaction** — LLM calls, the agent run, Twilio, `$fetch` tie up DB connections and locks. Pattern: API call BEFORE tx (if result is needed) or AFTER commit (side effects only). The agent run happens outside any tx; writing its plan (days + items + status) is one short tx at the end; the WhatsApp message goes after that commit

### Access

- Auth: every `/api/*` route except `server/constants/publicRoutes.ts` needs a session; handlers read `event.context.user!`. Each trip belongs to a user — controllers scope every trip read/write by `userId` and 404 on someone else's trip. Signup is server-side (`POST /api/auth/signup`): create the auth user, then insert `users` + the traveller's `people` row in one tx, delete the auth user if that fails
- Every trip-scoped endpoint loads by `tripId` and returns 404 when it doesn't exist. Child ids (day, item) are always checked to belong to that trip

### Database

- `useDrizzle()` from `server/utils/drizzle.ts` returns a singleton driver over a `pg` `Pool`. Auto-imported. Connection string from `useRuntimeConfig().databaseUrl` (`NUXT_DATABASE_URL`)
- Schema in `server/services/drizzle/schema.ts`. `casing: 'snake_case'` — no explicit column names
- Migrations in `drizzle-out/`. Generated via `pnpm db:migration:generate` — never hand-written. The only seed is the generated catalogue, `supabase/seed/catalogue.sql` (`pnpm db:catalogue:generate`)

### Error Handling

- Throw via `createError({ statusCode, statusMessage, data })` from H3. Nitro turns it into a structured JSON error
- Messages meant for the traveller go through `createUserError({ statusCode, message, data })` (`server/utils/errorUtils.ts`): `statusMessage` is an HTTP reason phrase (h3 strips non-ASCII from it), while the FE reads the text from `FetchError.data.message`
- Never `console.log` request bodies, phone numbers, preference values, prompts or model output containing PII. Log trip ids and short status strings only
- Validate response output with Zod (`ResSchema.parse(data)`) inside the route handler — the API boundary is where validation must happen, even if a controller also parses internally

## Agent Docs

Detailed instructions for specific tasks — read these when you need to create or modify the corresponding layer:

- [Routes](./agent-docs/routes.md) — H3 route handlers, Zod validation, request/response shape
- [Controllers](./agent-docs/controllers.md) — business logic, transactions, background runs
- [Repos](./agent-docs/repos.md) — Drizzle queries, one query per method, batch reads
- [Services](./agent-docs/services.md) — 3rd-party wrappers (Twilio, Deep Agents)
- [Middleware](./agent-docs/middleware.md) — none today; rules if one is ever added
- [Database](./agent-docs/database.md) — schema, migrations, naming, `useDrizzle()`
- [Types](./agent-docs/types.md) — server-only types vs `shared/schemas/`

## General Rules

- Always use `~~/server/...` and `~~/shared/...` aliases for cross-layer imports. Relative imports only for files one directory up
- Route handlers must contain zero business logic — parse → call controller → validate response → return
- Controllers NEVER access the database directly — all DB operations go through repos
- Repos: one method = one Drizzle query. Use `getTableColumns(table)` for column lists. Never `Promise.all(ids.map(id => repo.getById(id)))` — add a batch method using `inArray(...)`
- Always generate migrations via `pnpm db:migration:generate` — never write migration SQL by hand. Fix the schema, not the generated SQL
- Use `Promise.all()` for independent async operations — never sequentially when they don't depend on each other
- Never call external APIs (LLM, Twilio) inside a `useDrizzle().transaction(...)` callback
- The agent never gets a tool that books, pays, or contacts a provider

## Verify Before Done

```bash
pnpm lint
pnpm type-check
```

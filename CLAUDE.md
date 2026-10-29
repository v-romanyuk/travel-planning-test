## Project Overview

**Trip Planner** is a PoC (client test task) for an agent that plans trips in the background. A traveller describes a trip (starting point — defaults to their home city from the profile — destination, dates, who's going, WhatsApp number + opt-in), gets an immediate "I'll plan and come back — I won't book or charge anything" reply, can close the page, and receives a WhatsApp message (Twilio sandbox) with a link once the plan is ready or has failed. Nuxt 4 monorepo: SPA frontend (`app/`) on top of a Nuxt server (`server/`) that owns all business logic, talks to PostgreSQL via Drizzle ORM, runs the agent, and exposes a typed REST API consumed by the FE.

**Status:** the planning core is built API-only (knowledge graph, catalogue, trips, background agent run on a pg-boss queue — `plans/planning-core.md`). Screens beyond auth and WhatsApp are **planned**. Don't assume a file exists because a doc names it as planned; check the tree.

## Tech Stack

- **Nuxt 4** SPA (`ssr: false`) with Vue 3, Vite, experimental typed pages
- **Nitro / H3** for `server/api/*` routes
- **Drizzle ORM** + `node-postgres` (`pg`) for type-safe PostgreSQL access (local Supabase CLI stack — database only)
- **Zod v4** for request/response validation across the FE↔BE boundary
- **Nuxt UI v4** + **Tailwind CSS v4** (`app/assets/styles/main.css`, theme in `app/app.config.ts`), local SVG icons via `<Icon>` (`app/features/platform/icons/`)
- **Pinia**, **VueUse**, **dayjs**
- **LangGraph Deep Agents** (`deepagents`, JS) for the planning agent; **pg-boss** job queue in our Postgres for background runs
- **Twilio** (WhatsApp sandbox) for outbound notifications, plain REST (no SDK)
- **Fly.io** (one always-on machine, Nitro `node-server` preset) for hosting, deployed by `.github/workflows/deploy.yml`
- **pnpm** as the package manager

Supabase Auth with email + password (no email confirmation in the PoC); our own `users` table holds the profile (full name, home city — a GeoNames place picked via `GET /api/cities`, backed by the Open-Meteo geocoding API), linked to `auth.users` by `sub_id`. No Supabase Realtime/Storage. Nothing is ever booked or paid.

## Repository Layout

```
.config/                    # Nuxt config split: auto-imports, eslint, pages, ts, vite plugins (ModalsGenerator)
app/                        # Frontend (Vue 3). See app/CLAUDE.md
server/                     # Backend (Nitro/H3 + Drizzle + Zod). See server/CLAUDE.md
shared/                     # Cross-boundary Zod schemas, enums, constants used by both
drizzle-out/                # Generated Drizzle migrations
supabase/                   # Local Supabase stack: config.toml, seed/catalogue.sql (generated, see Local Development); migrations/ is a symlink to drizzle-out/
dts/                        # Global TS declarations (auto-loaded)
```

## Architecture Overview

```
Browser (app/) ──HTTP──▶ Nitro (server/api/) ──▶ Controllers ──▶ Repos ──▶ Drizzle ──▶ Postgres
                                                     │
                                                     ├──▶ services/queue   (pg-boss: plan-trip jobs)
                                                     ├──▶ services/agent   (Deep Agents run, rule compile)
                                                     └──▶ services/twilio  (WhatsApp message with link)
```

Single source of truth per concern:
- **Data writes and reads** — through `server/api/*` via Drizzle. The FE never talks to the database or Supabase directly
- **Trip** — origin (required; a city; defaults to the traveller's home city), destination, dates, status (`planning | ready | failed`), ordered days, items (`stay | place | transport`, name, time, why chosen, source of fact, status `planned`; transport items also carry from/to and arrival time), conversation messages. The plan the agent writes and the edits the traveller makes both live on the trip
- **Knowledge graph** — separate from the trip: traveller (incl. home city) + companions, preferences and hard constraints, each with a subject (person or party), domain (`stay | food | transport`) and value
- **Agent run** — started by the server, not tied to the HTTP request or the open page. Reads the knowledge graph and the trip as currently edited, searches the fixture catalogue through tools, writes the plan into the trip, sets the terminal status, then triggers the WhatsApp message

## Domain Rules

These are product invariants — any code path that touches the agent or the plan must hold them:

- **Nothing is booked or paid.** The agent has no tool that books, reserves, pays, or contacts a provider. Copy never implies otherwise
- **Grounded output only.** Every place, time and price in a plan comes from a tool result or from the trip. If the catalogue has nothing that fits, the plan says so — it never fills the gap with an invented item
- **Hard constraints remove, preferences rank.** A hard constraint filters options out; a preference only orders the remaining ones
- **Never invent preferences.** The agent uses only what the knowledge graph contains; with none, "why chosen" says so
- **Transport is planned like everything else.** Flights, trains and buses come from the catalogue, start at the trip's origin, and are filtered by transport hard constraints (e.g. no red-eye) and ranked by transport preferences (e.g. direct flights)
- **Edits are input.** The next agent run reads the trip as edited (removed items, edited days, notes), not the original plan

## Comments

- **No obvious comments** — don't explain *what* code does if the syntax makes it clear
- **Why, not what** — only complex business logic, non-obvious workarounds, or architectural decisions
- **Docstring only if necessary** — JSDoc/TSDoc for public-facing API methods or genuinely complex utilities
- **Brief and technical** — under one line, professional

## General Rules

- Always use `@/...` (FE) and `~~/...` (server cross-layer) absolute imports — never deep relative paths (`../../../`)
- Globally reusable utilities go in `app/utils/` (FE), `server/utils/` (server), or `shared/utils/` (both). Module-specific helpers stay co-located
- Cross-boundary Zod schemas, enums, and interfaces live in `shared/schemas/<domain>/` — one schema/enum per file
- Server-only types live in `server/types/`; FE-only types in `app/types/`. Single-file types stay inline (no `export`)
- Use `Promise.all()` for independent async operations — never run them sequentially when they don't depend on each other
- Never commit secrets. `.env*` files are gitignored (`.env.example` is the template)
- Always generate DB migrations via `pnpm db:migration:generate` — never write migration SQL by hand
- Don't guess CLI flags or API signatures (Deep Agents, Twilio, Nuxt UI included). Look up docs first via Context7 / WebSearch before responding. Faster than two wrong guesses

## Local Development

Local runs against the Supabase CLI stack — only its Postgres is used. `pnpm dev` reads `.env.local`, which points at `127.0.0.1` (see `.env.example`, README). `pnpm db:start` starts the stack and applies migrations; the Supabase CLI applies `drizzle-out/` through the `supabase/migrations` symlink — never run `supabase migration new`. The only seed is the fixture catalogue, `supabase/seed/catalogue.sql` (10,000 entries in 60 cities), written by `pnpm db:catalogue:generate` from the builder in `server/controllers/catalogue/buildCatalogue/` — edit the builder, never the SQL. `pnpm db:reset` reloads it. A deployed app seeds the same rows with the request page's "Seed catalogue" button (`POST /api/catalogue/seed`), shown only with `NUXT_CATALOGUE_SEED_ENABLED=true`. There are no seeded users, profiles or trips: sign up in the app.

## Verify Before Done

```bash
pnpm lint
pnpm type-check
```

Fix every reported error — don't triage "mine" vs "pre-existing". The user wants the command to pass.

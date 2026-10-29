# Trip Planner

PoC: a traveller asks an agent to plan a trip, closes the page, and gets a WhatsApp message with a link when the plan is ready (or has failed). Nothing is booked or paid. Architecture overview, the run's sequence, how each guarantee is enforced and why this stack: [`docs/architecture.md`](docs/architecture.md). Layer rules: `CLAUDE.md`.

## Local development

Runs against a local Supabase stack — Postgres and Auth are used (no realtime, no storage). The Supabase CLI does all of it: `supabase/migrations` is a symlink to `drizzle-out/`, and `supabase/seed/catalogue.sql` loads the fixture catalogue — 10,000 stays, places and transport legs in 60 European cities (configured in `supabase/config.toml`). The SQL is generated: change the builder in `server/controllers/catalogue/buildCatalogue/` and run `pnpm db:catalogue:generate`.

A deployed database isn't seeded by migrations. Set `NUXT_CATALOGUE_SEED_ENABLED=true` on the app (e.g. `fly secrets set NUXT_CATALOGUE_SEED_ENABLED=true`) and press **Seed catalogue** on the request page. It upserts the same 10,000 entries by ref, so pressing it again is safe; turn the flag off afterwards.

**Prerequisites:** Node (see `.nvmrc`), pnpm, Docker, [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started). On Windows, clone with `git config --global core.symlinks true`.

```bash
pnpm install
cp .env.example .env.local  # defaults point at the local stack
pnpm db:start               # start the stack and apply migrations + seed
pnpm dev
```

Open http://localhost:3000 and create an account at `/signup` — no users are seeded. Reykjavik has no catalogue entries on purpose, so a request there shows the failed state.

| Command | What it does |
|---|---|
| `pnpm db:start` | Start the stack and apply new migrations |
| `supabase stop` | Stop the stack; data is kept between runs |
| `pnpm db:reset` | Wipe the local DB, re-run migrations and the seed |
| `pnpm db:migration:generate` | Generate a migration from `server/services/drizzle/schema.ts` |
| `pnpm db:migration:run` | Apply pending migrations to `NUXT_DATABASE_URL` |

Studio: http://localhost:56323 · DB: `127.0.0.1:56322`. Ports are shifted to `563xx` (from the CLI's default `543xx`) so this stack can run alongside other local Supabase projects.

- Generate migrations only with `pnpm db:migration:generate` — never `supabase migration new` (it would write into `drizzle-out/` behind Drizzle's journal).
- The agent needs `NUXT_ANTHROPIC_API_KEY` (see `.env.example`). WhatsApp (Twilio sandbox) is optional: without `NUXT_TWILIO_*` (see `.env.example`) runs finish normally and no message is sent. A number only receives sandbox messages after it has sent `join <sandbox-code>` to the sandbox number (lasts 3 days), and free-form messages only arrive within 24 h of the phone's last message — join shortly before a demo.

## Deploy

Fly.io, one always-on machine (`fly.toml`, `Dockerfile`): the pg-boss worker runs inside the web process; crashed runs are recovered through pg-boss heartbeats. Push to `stage` or `master` runs `.github/workflows/deploy.yml`: build the image on Fly, `pnpm db:migration:run` against `MIGRATION_DATABASE_URL`, then deploy that image. Migrations run after a successful build and must stay backward-compatible.

One-time setup: `fly apps create <app>`, then `fly secrets set` for `NUXT_DATABASE_URL` (direct or session-mode Postgres — **not** the transaction pooler), `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_KEY`, `NUXT_SUPABASE_SECRET_KEY`, `NUXT_ANTHROPIC_API_KEY`, `NUXT_PUBLIC_APP_URL` (the Fly URL — it's the base of the WhatsApp link), `NUXT_TWILIO_ACCOUNT_SID`, `NUXT_TWILIO_AUTH_TOKEN`, `NUXT_TWILIO_WHATSAPP_FROM`. GitHub environments need secret `FLY_API_TOKEN` + `MIGRATION_DATABASE_URL` and variable `FLY_APP`.

**Troubleshooting**
- Local DB in a weird state → `pnpm db:reset`, or `supabase stop --no-backup && pnpm db:start` for a from-scratch run.

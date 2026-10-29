## Project Overview

**Trip Planner frontend** — Nuxt 4 SPA for the traveller. Built: the request form (`/`), the trips list, the trip page (`/trips/:tripId`, Conversation and Plan tabs with day editing), and the profile (`/profile`: the knowledge graph with fact and companion editing, and the home city).

## Tech Stack

- **Nuxt 4** SPA (`ssr: false`) with Vue 3, Vite, experimental typed pages (`navigateTo({ name: ... })` is type-checked)
- **Nuxt UI v4** for UI components (forms, buttons, cards, tables, modals, slideovers) + composables (`useToast`, `useOverlay`). `<UApp>` wraps the app in `app/app.vue`
- **Tailwind CSS v4** via `app/assets/styles/main.css` (`@import 'tailwindcss'; @import '@nuxt/ui';`), theme colors in `app/app.config.ts`
- **Icons** — local SVGs rendered with `<Icon name="..." />` (typed `TIcons`). See [Icons](./agent-docs/icons.md)
- **Pinia** for shared reactive state
- **VueUse** for utility composables
- **dayjs** for dates

## Development Patterns

### Dependency Flow

Strict one-way direction:

```
page/component → composable → store → service
                                  ↑
                            (service owns API calls)
```

- **Service** (`*.service.ts`, auto-imported) — pure API/domain logic via `$fetch('/api/...')`. Never knows about stores or composables
- **Store** (`*.store.ts`, auto-imported) — shared reactive state via Pinia (`defineStore` composition API). Can use services and other stores. Never uses orchestrating composables
- **Composable** (`use*.ts`, auto-imported) — business-logic orchestrator. Can use stores, services, and Nuxt UI composables
- **Component / Page** — consumes composables, stores, and services

### Pages vs Features vs Components

- **Pages** (`app/pages/`) — route-bound, file-based routing. See [Pages](./agent-docs/pages.md)
- **Features** (`app/features/`) — reusable isolated modules, route-agnostic. See [Features](./agent-docs/features.md)
- **Components** (`app/components/`) — globally-shared UI. Page- or feature-scoped components live next to their owner

### Data Access

- All data goes through `server/api/*` via `$fetch('/api/...')` inside a service. The FE has no database or Supabase client
- **Never type `$fetch` manually** (e.g., `$fetch<TTrip>(...)`). Nuxt auto-generates types from server routes — manual typing overrides this and masks mismatches. Use `$fetch('/api/...')` without generics and let inference work
- **Auth** — `@nuxtjs/supabase` owns the session (cookie). `useAuthStore()` signs in with `supabase.auth.signInWithPassword`, signs up through `POST /api/auth/signup` (server creates the auth user + `users` row) then signs in, and holds the current user from `GET /api/me` (the profile changes the home city through `PATCH /api/me` and writes the response back here). Every page except `login`, `signup` and `ui-kit` redirects to `/login` without a session (`redirectOptions` in `nuxt.config.ts`); after login the user returns to the page they asked for, so the WhatsApp link still lands on the plan. `guest` middleware keeps signed-in users off the auth pages
- **No realtime** — the agent runs in the background on the server. The plan page reads the trip on load; while `status === 'planning'` it refetches (e.g. `useIntervalFn`) until the status is `ready` or `failed`

### Error Handling

- Use `useToast().add({ title, description, color })` for user-facing errors. Read the server's text from `FetchError.data.message`. Don't silently swallow errors
- Confirmations (remove an item, discard edits) go through a `*Modal.vue` opened with `useModals()` — no `window.confirm`
- Don't `console.log` PII. Don't log payloads containing phone numbers, traveller names, or preference values

### Auto-Imports

The application has configured auto-imports — see [.config/auto-imports/](../.config/auto-imports/) for the source of truth.

Auto-imported (no manual `import`):
- **Components**: `app/components/**/*.vue`, `app/features/**/components/**/*.vue`, `app/pages/**/components/**/*.vue`, plus every Nuxt UI `U*` component
- **Composables**: `app/composables/`, `app/features/**/composables/`, `app/pages/**/composables/`
- **Services**: `app/services/`, `app/features/**/*.service.ts`, `app/pages/**/*.service.ts`
- **Stores**: `app/store/*.store.ts`, `app/features/**/*.store.ts`, `app/pages/**/*.store.ts`
- All Nuxt / Vue / Vue Router built-ins, Nuxt UI composables, plus VueUse via `@vueuse/nuxt`

Everything else requires explicit import.

## Custom Systems

### UI Kit

Live reference at `/ui-kit` (`app/pages/ui-kit/`). Check it before building a screen and add new shared pieces to it.

- **Tokens** — `app/assets/styles/main.css`: palettes `forest` (primary, success), `moss` (neutral), `ember` (hard rules) and the `--ui-*` overrides (muted text one step darker for 4.5:1 on the sage ground). Fonts: `font-display` (Bricolage Grotesque) for titles, times and names; `font-sans` (Hanken Grotesk) for the rest
- **Semantic colours** — `app/app.config.ts`. `color="rule"` is registered in `nuxt.config.ts` (`ui.theme.colors`) and is used **only** for hard constraints — never for warnings or decoration. Page ground is `bg-muted`, cards and inputs `bg-default`

### Modals

`*Modal.vue` files anywhere under `app/components/`, `app/features/`, or `app/pages/` are auto-registered by the `ModalsGenerator` Vite plugin into `app/features/platform/modals/modals-registry.ts`. Visibility is owned by `useModals()`, rendered by `<Modals />` in `app/layouts/Default.vue`. See [Modals](./agent-docs/modals.md).

### Typed Routes

`experimental.typedPages: true` is on. Always use named navigation: `navigateTo({ name: 'trips-tripId-plan', params: { tripId } })`, never a string path (`navigateTo('/trips/' + tripId)`). Route names are generated by Nuxt into `.nuxt/types/typed-router.d.ts`.

## Naming Conventions

- **Folders**: `kebab-case` (`trips/`, `knowledge-graph/`, `plan-day/`)
- **Vue components**: `PascalCase.vue` (`PlanDay.vue`, `EditDayModal.vue`)
- **TS files**: `kebab-case` with role suffix (`trips.service.ts`, `trip.store.ts`, `trip.types.d.ts`)
- **Composables**: `use` + `PascalCase` (`useTripPolling.ts`, `usePlanItemActions.ts`). Filename and export must match
- **Interfaces**: `I` prefix (`ITripForm`, `IPlanDay`)
- **Type aliases**: `T` prefix (`TTripRes`, `TUuid`)
- **Enums**: `E` prefix (`ETripStatus`, `EItemKind`, `EPreferenceDomain`)
- **Components conflicting with HTML tags**: prefix `App` (`AppHeader.vue`, `AppFooter.vue`)

## Agent Docs

Detailed instructions for specific tasks — read these when you need to create or modify the corresponding layer:

- [Pages](./agent-docs/pages.md) — route-bound pages, file-based routing
- [Features](./agent-docs/features.md) — reusable isolated modules
- [Components](./agent-docs/components.md) — global vs scoped, sizing, naming, Nuxt UI
- [Composables](./agent-docs/composables.md) — business-logic orchestration
- [Stores](./agent-docs/stores.md) — Pinia shared state
- [Services](./agent-docs/services.md) — API access via `$fetch('/api/...')`
- [Modals](./agent-docs/modals.md) — opening modals and writing modal components
- [Icons](./agent-docs/icons.md) — `<Icon>` component and type-safe `TIcons`

## General Rules

- Always prefer Vue 3 modern API (`defineModel`, `useTemplateRef`, `<script setup>`)
- Tailwind utilities inline in `class=""`. `:class` only for genuinely dynamic conditional classes. No `<style scoped>` blocks except for `<Transition>` child selectors
- Prefer Nuxt UI semantic tokens (`bg-default`, `text-muted`, `border-default`, `color="primary"`) over raw palette classes, so the theme in `app.config.ts` stays the single source
- Static text stays in template — never extract labels/titles into JS `const` to shorten lines. Break attributes across lines instead
- All user-facing text is English — keep tone consistent with existing copy. No i18n framework (single-locale)
- Plan items are always shown as *planned* — copy never says booked, reserved, confirmed or paid
- Always use named navigation: `navigateTo({ name: ... })` or `router.push({ name: ... })`
- Never `as any` — fix the actual type issue
- Never `export default` (exception: Nuxt-required files — pages, layouts, plugins, middleware, `app.config.ts`)
- Never type `$fetch` manually (`$fetch<T>(...)`) — let Nuxt's server-route inference work
- Never use the `void` operator before a fire-and-forget promise — unnecessary noise (ESLint config doesn't flag floating promises)
- Pass props in camelCase to custom components (`:tripId="id"`, not `:trip-id="id"`). Kebab-case only for native HTML attributes
- Component size soft limit: ~200 lines. Decompose into child components in co-located `components/`
- Check VueUse and Nuxt UI components/composables before creating custom solutions
- Forms never shift on validation: every `UFormField` reserves one line under its control and renders help/error inside it (`formField` in `app.config.ts`). Wrap every control in `UFormField`, space fields with `gap-1` and nothing below them, keep help and error text to one short line (it truncates), and never render a validation message outside `UFormField`

## Verify Before Done

```bash
pnpm lint
pnpm type-check
```

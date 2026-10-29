# Services

Services are pure API/domain logic. They call `server/api/*` via `$fetch` and return typed responses. They never know about stores, composables, or Vue reactivity.

## Pattern

A service is a **class with a singleton export** (Softonix). Filename ends in `.service.ts`. Consumers call the singleton directly (`tripsService.getById(id)`) — never a `useXxxService()` wrapper.

```ts
// app/services/trips.service.ts (illustrative — planned)
import type { TCreateTripReq } from '~~/shared/schemas/trips/CreateTripReqSchema'
import type { TUpdateTripDayReq } from '~~/shared/schemas/trips/UpdateTripDayReqSchema'

class TripsService {
  getById (tripId: string) {
    return $fetch(`/api/trips/${tripId}`)
  }

  createTrip (body: TCreateTripReq) {
    return $fetch('/api/trips', { method: 'POST', body })
  }

  updateDay (tripId: string, dayId: string, body: TUpdateTripDayReq) {
    return $fetch(`/api/trips/${tripId}/days/${dayId}`, { method: 'PATCH', body })
  }

  deleteItem (tripId: string, itemId: string) {
    return $fetch(`/api/trips/${tripId}/items/${itemId}`, { method: 'DELETE' })
  }
}

export const tripsService = new TripsService()
```

### Method naming

- Reads: `getAll` (list), `getById`, plus descriptive reads (`getKnowledgeGraph`, `getMessages`).
- Writes: `create<Entity>` / `update<Entity>` / `delete<Entity>` (e.g. `createTrip`, `updateDay`, `deleteItem`), plus descriptive actions (`replanTrip`, `addNote`).
- Query-string params go through the `query` option (`$fetch('/api/...', { query })`); path params interpolate into the URL.

## Scope

| Scope | Path | When |
|---|---|---|
| Global | `app/services/` | API surface shared across many features/pages |
| Feature | `app/features/{feature}/*.service.ts` | API surface owned by one feature |
| Page | `app/pages/{page}/*.service.ts` | API surface owned by one page tree |

All auto-imported. Filename must end in `.service.ts`.

## Hard Rules

### No manual `$fetch` typing

Never add generic type params to `$fetch` (e.g., `$fetch<TTrip>(...)`). Nuxt auto-generates types from server routes — manual typing overrides this and masks mismatches between FE and BE. Use `$fetch('/api/...')` without generics. Let inference work.

### No `useHttp`-style wrapper

Don't reintroduce a wrapper composable around `$fetch`. Auth travels in the Supabase session cookie (same-origin, sent automatically), so there is no header to attach, and base URL handling is unnecessary for same-origin `/api/*` calls. Direct `$fetch` keeps inference intact.

### Services don't orchestrate

Services return promises. They do NOT manage loading state, show toasts, or navigate — that's the composable's job. A typical flow:

```
composable → loading flag + try/catch + useToast + service call
service    → $fetch
```

### Request/response shapes come from `shared/schemas/`

When you need to pass explicit types for request payloads or query params, import `T*Req` / `T*Res` from `shared/schemas/<domain>/`. Don't redefine API shapes on the FE.

### One service per logical resource

A service class may hold multiple methods covering all verbs (`getById`, `createTrip`, `updateDay`, ...) for that resource. Don't split a single resource across multiple services. One `class` + one singleton `const` export per file — no `export default`.

### No circular composition

Services can call other services when composing requests, but the dependency graph must be acyclic. If two services need shared logic, extract it to `app/utils/`.

### Errors propagate

Don't swallow with `try/catch { return null }`. The caller (composable) decides how to surface the error to the user.

# Routes

Nuxt file-based server routes under `server/api/`. Filename determines HTTP method and path (`health.get.ts` → `GET /api/health`). Dynamic params via brackets (`[tripId].get.ts`).

## Folder Structure

```
server/api/
├── trips/
│   ├── index.get.ts                      # the user's trips, newest first
│   ├── index.post.ts                     # create trip, enqueue the run, respond immediately
│   ├── [tripId].get.ts                   # trip + days + items + gaps + messages + latest run
│   └── [tripId]/
│       ├── replan.post.ts                # new run over the edited trip (409 while planning)
│       └── days/[dayId].patch.ts         # "Save day": title, note, item removals and notes in one request
├── catalogue/
│   ├── index.get.ts                      # entry count + whether seeding is enabled
│   └── seed.post.ts                      # upsert the fixture catalogue (NUXT_CATALOGUE_SEED_ENABLED only)
├── knowledge-graph/
│   ├── index.get.ts                      # people + facts as nodes/edges
│   ├── people/                           # add / remove companions
│   └── facts/                            # create / edit (recompiles the rule) / delete
├── auth/signup.post.ts, cities.get.ts, me.get.ts, me.patch.ts
└── health.get.ts
```

References: `shared/schemas/<domain>/` for request/response schemas

## Hard Rules

### Handlers parse + delegate only

Route handlers must never use `useDrizzle()` or interact with the database directly. They only:

1. Parse and validate request input
2. Delegate to a controller
3. Validate and return response

No business logic in handlers. No repo imports. No agent or Twilio calls. (`health.get.ts` is the one deliberate exception — a raw `SELECT 1` connectivity probe.)

### Validate request input

Use H3 utilities with Zod parse:

```ts
import { readValidatedBody } from 'h3'
import { CreateTripReqSchema } from '~~/shared/schemas/trips/CreateTripReqSchema'
import { CreateTripResSchema } from '~~/shared/schemas/trips/CreateTripResSchema'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, b => CreateTripReqSchema.parse(b))
  const result = await createTrip(body)
  return CreateTripResSchema.parse(result)
})
```

Route params go through `getValidatedRouterParams` with a schema that requires UUIDs (`z.uuid()`) — a malformed id is a 400, not a DB error.

### Validate response output

Every endpoint must validate its response with a Zod schema before returning:

```ts
return ResSchema.parse(data)
```

Even if a controller parses internally — the route handler is the API boundary where validation must happen. If both parse, remove from the controller, never from the handler.

Response schemas live in `shared/schemas/<domain>/`. List fields explicitly — never `.omit()` / `.pick()` on a base schema for responses. Never return the WhatsApp number back in full where it isn't needed.

### Respond before the agent finishes

An endpoint that starts an agent run (`POST /api/trips`, `replan`) returns as soon as the trip and the acknowledgement message are persisted. It never awaits the run.

### Auth

`01.auth.ts` sets `event.context.user` for every non-public route (see [Middleware](./middleware.md)). Handlers pass `event.context.user!.id` with `tripId` (and child ids) to the controller, which 404s on anything missing, not the caller's, or not belonging to the trip. Don't add `requireAuth`-style helpers.

### Imports

Use `~~/` alias for cross-layer imports (`~~/server/controllers/...`, `~~/shared/schemas/...`). Relative imports only for one-level-up files.

### Error throwing

Use `createError({ statusCode, statusMessage, data })` from H3, or `createUserError` for text the traveller should read. Don't `throw new Error(...)` — Nitro can't format it into a clean JSON response.

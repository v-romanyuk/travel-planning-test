# Types

Zod schemas, enums, and TypeScript interfaces organized by audience.

## Placement Rules

| Used by | Place in | Example |
|---|---|---|
| Server + frontend | `shared/schemas/<domain>/` | `shared/schemas/trips/CreateTripReqSchema.ts` |
| Server-only, ≥2 files | `server/types/<domain>/` | `server/types/trips/Trip.ts`, `server/types/agent/SearchCatalogueToolSchema.ts` |
| Frontend-only, ≥2 files | `app/types/` | `app/types/plan.types.d.ts` |
| Single file | inline, no `export` | inside the consuming `.ts` file |


## Naming

- `*ReqSchema` — data sent FE → BE (request bodies, query params, route params). Examples: `CreateTripReqSchema`, `UpdateTripDayReqSchema`, `TripParamsReqSchema`
- `*ResSchema` — data sent BE → FE. Examples: `TripResSchema`, `KnowledgeGraphResSchema`
- Enums: no suffix, `E` prefix. Filename = enum name without prefix. `TripStatus.ts` → `ETripStatus` (`planning | ready | failed`). `ItemKind.ts` → `EItemKind` (`stay | place | transport`). `PreferenceDomain.ts` → `EPreferenceDomain` (`stay | food | transport`)
- Type aliases: `T` prefix + entity name (`TTrip`, `TCreateTripReq`, `TTripRes`)
- Interfaces: `I` prefix (`ITripsRepo`, `IRunPlanningAgentArgs`)

## Hard Rules

### One schema/enum per file

One Zod schema, one enum, or one interface per file. Filename matches the export. If a file mixes two (e.g., `Trip.ts` containing `TripSchema` + `TripDaySchema`) — split.

### No `.omit()` / `.pick()` on response schemas

Response schemas must list fields explicitly. You should see exactly what an endpoint returns by reading its response schema alone. Request schemas may use `.omit()` / `.pick()` / `.extend()` on a base.

### No functions in `shared/schemas/`

Schemas, enums, and types only. If a file would `export function …` from `shared/schemas/`, move the function to `app/utils/` (FE), `server/utils/` (server) or `shared/utils/` (both). Schemas/enums it depends on can stay in shared.

### Single-prop interface → inline

```ts
// bad
interface IReplanContext { tripId: string }
function replan (ctx: IReplanContext) {}

// good — collapse, no interface
function replan (tripId: string) {}
```

For 2 props prefer two positional args. 3+ props → object param.

### Don't export what nobody imports

Drop `export` from interfaces/types/consts used only inside their own file. Verify:

```bash
grep -rn "ISomething" --include="*.ts" --include="*.vue"
```

1 hit (the definition) → unexport. ≥2 hits + ≥2 files → follow placement table above.

### Enums for constrained values

Fields with a fixed set of values (status, kind, domain, preference vs hard constraint) must use TypeScript enums with `z.enum()` — never bare `z.string()`. `z.enum(ETripStatus).default(ETripStatus.PLANNING)`.

### Array validation

When parsing arrays with Zod, use `Schema.array().parse(rows)` — never `rows.map(row => Schema.parse(row))`.

### Repos must not import schemas

Repository code (`server/repos/`) must never import from `shared/schemas/`. If a repo needs a parameter or return type, define it in `server/types/<domain>/` (or inline if single-file). Route handlers and controllers do the bridging between request/response schemas and repo signatures.

### Agent tool schemas are server-only

Tool input/output schemas the agent sees live in `server/types/agent/`, not `shared/schemas/` — they are not part of the HTTP API. Tool outputs carry an identifier of where each fact came from, so the plan can store it as the item's source of fact.

### Domain types = Zod with inferred TS

Prefer Zod schemas with inferred TS types over hand-written interfaces. Enables reuse in validation AND type checking (and in `<UForm :schema>` on the FE):

```ts
export const TripResSchema = z.object({ id: z.uuid(), destination: z.string(), status: z.enum(ETripStatus), … })
export type TTripRes = z.infer<typeof TripResSchema>
```

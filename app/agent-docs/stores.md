# Stores

Pinia stores hold shared reactive state. Only create a store when state is needed across multiple components or composables.

## When NOT to Create a Store

- State is local to one component → use `ref` / `reactive` in the component
- State is local to one composable → keep it there
- Data comes from the server and only needs cached fetch → keep the cache in a service helper, not a store

Create a store only when the same reactive state needs to be read or mutated across multiple components/composables.

## Scope

| Scope | Path | When |
|---|---|---|
| Global | `app/store/*.store.ts` | App-wide state (general settings, the knowledge graph if several screens read it) |
| Feature | `app/features/{feature}/*.store.ts` | State owned by a single feature |
| Page | `app/pages/{page}/*.store.ts` | State scoped to one page tree (e.g. the trip on the plan page) |

All auto-imported. Filename must end in `.store.ts`.

References: none yet — no store exists in the boilerplate

## Pattern

Use the composition API form of `defineStore`:

```ts
// app/pages/trips/[tripId]/trip.store.ts (illustrative — planned)
import { ETripStatus } from '~~/shared/schemas/trips/TripStatus'
import type { TTripRes } from '~~/shared/schemas/trips/TripResSchema'

export const useTripStore = defineStore('trip', () => {
  const trip = ref<TTripRes>()

  const isPlanning = computed(() => trip.value?.status === ETripStatus.PLANNING)
  const sortedDays = computed(() => [...(trip.value?.days ?? [])].sort((a, b) => a.position - b.position))

  async function fetchTrip (tripId: string) {
    trip.value = await tripsService.getById(tripId)
  }

  return { trip, isPlanning, sortedDays, fetchTrip }
})
```

Stores call the **singleton services** directly (`tripsService.getById()`) — auto-imported, no `useXxxService()` wrapper. Wire types come from `~~/shared/schemas`.

## Hard Rules

### Composition API only

Always use `defineStore('name', () => { ... })`. Never the options form.

### Naming

`useThingStore` exported from `thing.store.ts`. The `defineStore` id is **camelCase** (`trip`, `knowledgeGraph`) — the filename without `.store`, camelCased for multi-word names.

### Stores use services, not composables

Stores can use **services** for API calls and **other global stores** for derived state. Stores must NEVER use orchestrating composables (composables orchestrate stores, not the reverse).

### Use `storeToRefs` to destructure

When consuming a store in a component or composable, destructure reactive state via `storeToRefs(useStore())`. Plain destructuring loses reactivity.

### No side effects in stores

Don't put `useToast` / `navigateTo` calls inside store actions — those are orchestration concerns. Polling intervals live in a composable too, not the store. Wrap the store call in a composable that handles them.

### Cross-store usage

Cross-store usage is fine when one is clearly foundational (e.g., a global `knowledgeGraph.store` read by the trip store). Avoid peer-to-peer dependencies that create cycles.

### Don't create stores for single-view state

Only for shared state across multiple areas. Single-view state lives in the component or its composable.

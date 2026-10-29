# Composables

Composables are the business-logic orchestrators. They wire stores, services, and reactive state together. Create a composable when you need reusable stateful logic, or to break down a large module into smaller pieces.

## Global vs Scoped

| Scope | Path | When |
|---|---|---|
| Global | `app/composables/` | Reusable across the entire app |
| Feature | `app/features/{feature}/composables/` | Logic specific to a feature |
| Page | `app/pages/{page}/composables/` | Logic specific to a page tree |

All three locations auto-import globally — scope is "where it makes sense to live."

References: `app/features/platform/modals/composables/useModals.ts`

## Rules

- Naming: `useThing.ts` exporting `useThing` as a named function. Filename and export must match
- Composables own async orchestration — services return promises, composables `await` them and manage loading/error state
- Reactive returns: prefer `computed(() => state.value.x)` over raw refs for derived values exposed to templates
- Cleanup side effects in `onUnmounted` (polling intervals, timers, event listeners, intersection observers, etc.) — VueUse helpers like `useIntervalFn` clean up on their own
- Check VueUse first before creating a new one — `@vueuse/nuxt` is installed and auto-imports `useDebounce`, `useThrottle`, `useEventListener`, `useIntervalFn`, `useStorage`, and many others
- Composables can use stores, services, and other composables. They never fetch outside a service

## Pattern

```ts
// app/pages/trips/[tripId]/composables/usePlanItemActions.ts (illustrative — planned)
import type { TTripItemRes } from '~~/shared/schemas/trips/TripItemResSchema'

export function usePlanItemActions (tripId: string) {
  const loading = ref(false)
  const toast = useToast()

  async function onRemove (item: TTripItemRes) {
    loading.value = true
    try {
      await tripsService.deleteItem(tripId, item.id)
      toast.add({ title: 'Removed from the plan', color: 'success' })
    } catch (error) {
      toast.add({ title: 'Could not remove the item', description: getErrorMessage(error), color: 'error' })
    } finally {
      loading.value = false
    }
  }

  return { loading, onRemove }
}
```

Composables call the **singleton services** directly (`tripsService.deleteItem(...)`) — no `useXxxService()` wrapper. Named export only (no `export default`).

- Service does the API call; composable orchestrates the user-facing flow
- The toast carries the server's message (`FetchError.data.message`) when there is one, not only a generic line. `getErrorMessage` (`app/utils/errorUtils.ts`) reads it, including the first issue of a rejected Zod body; `getFormErrors` maps those issues onto `UFormField` names

# Components

All `.vue` files. Three valid locations, each with its own auto-import scope.

## Where Components Live

| Location | Auto-import scope | When to use |
|---|---|---|
| `app/components/**/*.vue` | global | UI used across multiple pages/features |
| `app/features/**/components/**/*.vue` | global | Component belongs to a self-contained feature |
| `app/pages/**/components/**/*.vue` | global | Component used only within one page tree |

Scope is "where it makes sense to live," not "where it's importable from" — all three locations auto-import globally.

## Naming

- `PascalCase.vue` — always
- Components conflicting with native HTML tags get an `App` prefix: `AppHeader.vue`, `AppFooter.vue`
- `*Modal.vue` is reserved — these get auto-registered by the modals plugin (see [Modals](./modals.md))
- Feature components prefix with the feature domain: `KnowledgeGraph.vue`, `KnowledgeGraphPerson.vue`
- Page-scoped components don't need a prefix (their folder gives them context)
- Don't prefix your own components with `U` — that namespace belongs to Nuxt UI

## Sizing

Soft limit: ~200 lines per `.vue` file. Decompose into child components in co-located `components/` if you exceed.

## Style

- Tailwind utilities inline in `class=""`. `:class` only for genuinely dynamic conditional classes
- No `<style scoped>` blocks. Exception: `<Transition>` child selectors that Tailwind can't express
- If a class string exceeds ~120 chars — split across lines or decompose
- Static text stays in the template. Never extract labels/titles to JS `const` to shorten lines
- Prefer Nuxt UI semantic tokens (`text-muted`, `bg-elevated`, `border-default`) and the `color` / `variant` props over raw palette classes

## Vue 3 Modern API

- `<script setup lang="ts">` only — never Options API
- `defineModel()` for v-model bindings — never explicit `props` + `emit('update:modelValue')` pair
- `useTemplateRef('name')` for template refs — never plain `ref<HTMLElement>()` paired with `ref="name"`
- `defineProps<T>()` / `defineEmits<{...}>()` with TS types — never the runtime object form for typed components

## Props

- Pass props in camelCase to custom components: `:tripId="id"`, not `:trip-id="id"`
- Kebab-case acceptable only on native HTML attributes

## UI Kit

Trip-specific building blocks (plan trail, item card, status badge, profile facts, chat bubble) already exist in `app/components/` — see `/ui-kit` and the UI Kit section of `app/CLAUDE.md`. Compose them instead of restyling Nuxt UI primitives per screen. A new globally reused piece gets a demo in `app/pages/ui-kit/components/`.

## Nuxt UI

Use Nuxt UI components and composables before rolling your own:
- Forms: `<UForm :schema>` (takes the shared Zod schema directly), `<UFormField>`, `<UInput>`, `<UInputDate>` / `<UCalendar>`, `<USelect>`, `<USelectMenu>`, `<UTextarea>`, `<UCheckbox>`, `<UButton>`
- Layout & content: `<UCard>`, `<UBadge>`, `<UAlert>`, `<USeparator>`, `<USkeleton>`, `<UEmpty>`
- Feedback: `useToast()` for notifications; confirmations via a `*Modal.vue` (see [Modals](./modals.md))
- Tables: `<UTable>`
- Overlays: `<UModal>`, `<USlideover>`, `<UPopover>`, `<UTooltip>`
- Icons: `<Icon name="trash-2" />` — never `<UIcon>`. For a Nuxt UI `icon` prop pass the local collection name: `<UButton icon="icon:trash-2">`. See [Icons](./icons.md)

For overlays tied to a flow, use the project's modals system (see [Modals](./modals.md)) rather than a local `<UModal>` with its own open state.

Look up component props in the Nuxt UI v4 docs (Context7) — v4 renamed several v2/v3 props, don't guess.

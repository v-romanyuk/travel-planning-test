# Features

Reusable, route-agnostic modules under `app/features/`. Create a feature when the module can be used across multiple pages or represents a self-contained domain.

## When to Create a Feature

- The module is not tied to a specific route
- It could be reused across multiple pages
- It represents a self-contained domain (e.g., knowledge graph, trip status, platform infrastructure)

**Route-bound ≠ feature.** If every component/service/store in a module is consumed exclusively under a single page tree, it belongs in `app/pages/{page}/`, not `app/features/`.

## Folder Structure

```
app/features/{feature-name}/
├── feature-name.service.ts         # Feature API service (optional)
├── feature-name.store.ts           # Shared state (optional — only if shared across consumers)
├── feature-name.types.d.ts         # Feature-scoped types (optional)
├── composables/                    # Feature-scoped composables (optional)
│   └── useFeatureName.ts
└── components/                     # ALL .vue files go here (required for auto-import)
    ├── FeatureName.vue             # Main feature component
    └── FeatureNamePart.vue         # Supporting components
```

References: `app/features/platform/modals/`

## Isolation Rules

1. Features NEVER depend on other features — no imports from `app/features/{other-feature}/`
2. Features NEVER import from pages — no imports from `app/pages/`
3. Each feature has ONE single responsibility
4. Cross-feature logic gets extracted to `app/composables/`, `app/utils/`, or a new `platform/` sub-feature

## All `.vue` Files Live in `components/`

The main feature component (e.g., `KnowledgeGraph.vue`) goes inside `components/`, not at the feature root. Required for auto-import — the Nuxt scanner pattern is `app/features/**/components/**/*.vue`.

## Store Is Optional

Only create a `.store.ts` when state needs to be shared across multiple consumers. If state is local to one component or composable, keep it there.

## The `platform/` Feature

`app/features/platform/` is special infrastructure — today it holds only the modals registry and host. Do not use it as a template for regular features.

## Domain Prefixing

All files within a feature are prefixed with the feature domain name:
- Components: `PascalCase` prefix — `KnowledgeGraph.vue`, `KnowledgeGraphPerson.vue`, `KnowledgeGraphPreference.vue`
- TS files: `kebab-case` prefix — `knowledge-graph.service.ts`, `knowledge-graph.store.ts`, `knowledge-graph.types.d.ts`
- Composables: `use` + `PascalCase` domain — `useKnowledgeGraph.ts`

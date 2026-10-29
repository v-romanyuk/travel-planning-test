# Icons

Project icons live as SVG files under `app/features/platform/icons/assets/`. Render them with the `<Icon name="..." />` component (auto-imported from `app/features/platform/icons/components/Icon.vue`). Names are type-safe via the auto-generated `TIcons` union in `app/features/platform/icons/icons.d.ts`.

References: `app/features/platform/icons/components/Icon.vue`, `.config/icon-names-generator/`, `nuxt.config.ts` `icon` configuration

## Usage

```vue
<Icon name="shield-check" class="size-5 text-primary" />
<UButton icon="icon:trash-2" color="error" variant="outline">Remove from plan</UButton>
```

- Pass the bare icon name (`"shield-check"`) to `<Icon>` — it adds the `icon:` collection prefix before delegating to `<NuxtIcon>`
- Nuxt UI `icon` / `leading-icon` / `trailing-icon` props take a plain string, so pass `icon:<name>` there. That string is not type-checked — match an existing filename
- `name` prop is typed as `TIcons` — only existing SVG filenames are accepted
- Size and color via Tailwind utilities (`size-5`, `text-primary`) — SVGs use `currentColor`
- Mode is `svg` (inline), so utility classes apply

## Adding a New Icon

1. Drop the `.svg` file into `app/features/platform/icons/assets/`. UI icons are Lucide (24×24, stroke 2, ISC licence) — copy the icon's SVG from `@iconify-json/lucide` or lucide.dev so the set stays consistent
2. The `IconNamesGenerator` Vite plugin regenerates `icons.d.ts` and the `TIcons` union — no restart needed in dev
3. Reference it as `<Icon name="your-file-name" />`

## Rules

- Always use `<Icon name="..." />` — never `<UIcon>`, `<NuxtIcon>` directly, or inline `<svg>` markup. Exceptions: `public/favicon.svg` and `app/spa-loading-template.html`, which render outside Vue
- `@nuxt/icon`'s global component is renamed to `NuxtIcon` (`icon.componentName`) so `Icon` is ours. Nuxt UI's internal icons (select chevrons, close buttons, loaders) still resolve through its own `UIcon` — leave them alone
- Filename convention: kebab-case, matching the Lucide name (`trash-2.svg`, `circle-help.svg`). The brand mark is `logo.svg`
- SVGs must use `currentColor` for strokes/fills. Hardcoded colours lock the icon to one palette
- Keep the asset set tight — check for an existing icon before adding one

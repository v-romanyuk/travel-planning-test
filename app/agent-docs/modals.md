# Modals

Modals are `*Modal.vue` files anywhere under `app/components/`, `app/features/`, or `app/pages/`. They're auto-discovered by the `ModalsGenerator` Vite plugin and registered into `app/features/platform/modals/modals-registry.ts` — generated, never edit it by hand. The open/close state of every modal is owned by `useModals()`, not by the modal component itself.

References: `.config/modals-generator/`, `app/features/platform/modals/composables/useModals.ts`, `app/features/platform/modals/components/Modals.vue`

## Opening a Modal

```ts
const { openModal, closeModal } = useModals()

openModal('EditDayModal', { day, onSave })
// later
closeModal('EditDayModal')
```

Modal name is the filename without `.vue` (e.g. `EditDayModal.vue` → `'EditDayModal'`). Names and props are type-safe based on the generated registry and the modal's `defineProps`.

## Writing a Modal Component

A modal gets its visibility from `useModals()` — never a local `open` ref.

```vue
<!-- app/pages/trips/[tripId]/components/RemoveItemModal.vue (illustrative — planned) -->
<template>
  <UModal
    :open="isOpen.RemoveItemModal"
    title="Remove from the plan?"
    @update:open="closeModal('RemoveItemModal')"
  >
    <template #body>
      <p>{{ itemName }} will be removed from this day.</p>
    </template>

    <template #footer>
      <UButton color="neutral" variant="ghost" @click="closeModal('RemoveItemModal')">
        Cancel
      </UButton>
      <UButton color="error" @click="onConfirmClick">
        Remove
      </UButton>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{ itemName: string, onConfirm: () => void }>()
const { isOpen, closeModal } = useModals()

function onConfirmClick () {
  props.onConfirm()
  closeModal('RemoveItemModal')
}
</script>
```

- Filename ends in `Modal.vue` — required for auto-registration
- Props are passed through `openModal('Name', props)` and received via `defineProps`
- Bind `<UModal :open="isOpen.ModalName" @update:open="closeModal('ModalName')">` — `isOpen` is a read-only computed, so `v-model:open` will NOT work
- Call `closeModal('ModalName')` from button handlers to dismiss — never mutate `isOpen`
- The Vite plugin watches the three scan dirs; new modal files become available without restarting `nuxt dev`

## Rules

- Don't render modals inside conditional `v-if` blocks scattered through pages, and don't keep a local `open` ref with an inline `<UModal>`. Use the `useModals` API — the `<Modals />` host in `app/layouts/Default.vue` renders all of them
- Never `v-model:open` on a registered modal — the computed has no setter
- One modal per file. Don't pack multiple dialogs into a single `*Modal.vue`
- Modal components follow the same rules as regular components: ~200 line soft limit, Tailwind inline, named navigation, etc.
- Don't put modal-specific business logic inside the modal component — accept a callback prop (`onConfirm`, `onSave`) or emit an event, and orchestrate from the caller's composable

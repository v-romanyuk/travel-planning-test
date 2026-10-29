<template>
  <UModal
    :open="isOpen.AppConfirmModal"
    :title="title"
    @update:open="closeModal('AppConfirmModal')"
  >
    <template #body>
      <p class="text-muted">
        {{ description }}
      </p>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          color="neutral"
          variant="ghost"
          @click="closeModal('AppConfirmModal')"
        >
          Cancel
        </UButton>
        <UButton
          :color="confirmColor"
          loading-auto
          @click="handleConfirm"
        >
          {{ confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

const { onConfirm, title, description, confirmColor = 'error', confirmLabel = 'Confirm' } = defineProps<{
  title: string
  description: string
  confirmLabel?: string
  confirmColor?: ButtonProps['color']
  onConfirm: () => unknown
}>()

const { isOpen, closeModal } = useModals()

async function handleConfirm () {
  await onConfirm()
  closeModal('AppConfirmModal')
}
</script>

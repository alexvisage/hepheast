<script setup lang="ts">
import { useId, useTemplateRef, watch } from 'vue'

import BaseButton from './BaseButton.vue'

/**
 * Confirmation avant une action destructrice ou irréversible.
 * S'appuie sur <dialog> natif : piège du focus, touche Échap et fond inerte inclus.
 */
withDefaults(
  defineProps<{
    title: string
    confirmLabel: string
    cancelLabel?: string
    /** Action destructrice : bouton de confirmation en rouge */
    danger?: boolean
  }>(),
  { cancelLabel: 'Annuler' },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const open = defineModel<boolean>('open', { default: false })

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const titleId = useId()

watch(
  [open, dialog],
  ([isOpen, element]) => {
    if (!element) return
    if (isOpen && !element.open) element.showModal()
    if (!isOpen && element.open) element.close()
  },
  { immediate: true },
)

function cancel() {
  open.value = false
  emit('cancel')
}

function confirm() {
  open.value = false
  emit('confirm')
}
</script>

<template>
  <dialog
    ref="dialog"
    class="dialog"
    :aria-labelledby="titleId"
    @cancel.prevent="cancel"
    @click.self="cancel"
  >
    <div class="dialog__panel">
      <h2 :id="titleId" class="dialog__title">{{ title }}</h2>
      <div class="dialog__body"><slot /></div>
      <div class="dialog__actions">
        <BaseButton variant="ghost" @click="cancel">{{ cancelLabel }}</BaseButton>
        <BaseButton :variant="danger ? 'danger' : 'primary'" @click="confirm">
          {{ confirmLabel }}
        </BaseButton>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(28rem, calc(100% - 2 * var(--space-4)));
  padding: 0;
  color: var(--color-text);
  background-color: var(--color-surface-raised);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-overlay);
}

.dialog::backdrop {
  background-color: var(--color-backdrop);
}

.dialog__panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
}

.dialog__title {
  font-size: var(--font-size-lg);
}

.dialog__body {
  color: var(--color-text-muted);
}

.dialog__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>

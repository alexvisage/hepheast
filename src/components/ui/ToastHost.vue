<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from '@lucide/vue'

import { useToastStore, type ToastTone } from '@/stores/toasts'

const store = useToastStore()
const { toasts } = storeToRefs(store)

const icons = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
} satisfies Record<ToastTone, unknown>
</script>

<template>
  <div class="toasts" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="`toast--${toast.tone}`">
        <component :is="icons[toast.tone]" class="toast__icon" :size="20" aria-hidden="true" />
        <p class="toast__message">{{ toast.message }}</p>
        <button
          type="button"
          class="toast__close"
          aria-label="Fermer la notification"
          @click="store.dismiss(toast.id)"
        >
          <X :size="16" aria-hidden="true" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  inset: auto var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom)) var(--space-4);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  pointer-events: none;
}

@media (width >= 64rem) {
  .toasts {
    inset: auto var(--space-6) var(--space-6) auto;
    align-items: flex-end;
  }
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: min(26rem, 100%);
  padding: var(--space-3) var(--space-3) var(--space-3) var(--space-4);
  background-color: var(--color-surface-raised);
  border: 1px solid var(--color-border-strong);
  border-left-width: 4px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-overlay);
  pointer-events: auto;
}

.toast--info {
  border-left-color: var(--color-text-muted);
}

.toast--success {
  border-left-color: var(--color-success);
}

.toast--warning {
  border-left-color: var(--color-warning);
}

.toast--danger {
  border-left-color: var(--color-danger);
}

.toast__icon {
  flex-shrink: 0;
}

.toast--success .toast__icon {
  color: var(--color-success);
}

.toast--warning .toast__icon {
  color: var(--color-warning);
}

.toast--danger .toast__icon {
  color: var(--color-danger);
}

.toast__message {
  flex: 1;
  font-size: var(--font-size-sm);
}

.toast__close {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  color: var(--color-text-muted);
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
</style>

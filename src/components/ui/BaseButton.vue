<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import { LoaderCircle } from '@lucide/vue'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    type?: 'button' | 'submit' | 'reset'
    /** Transforme le bouton en lien de navigation */
    to?: RouteLocationRaw
    block?: boolean
    loading?: boolean
    disabled?: boolean
  }>(),
  { variant: 'primary', size: 'md', type: 'button', to: undefined },
)

const isDisabled = computed(() => props.disabled || props.loading)

const classes = computed(() => [
  'button',
  `button--${props.variant}`,
  `button--${props.size}`,
  { 'button--block': props.block, 'button--loading': props.loading },
])
</script>

<template>
  <RouterLink v-if="to && !isDisabled" :to="to" :class="classes">
    <slot name="icon" />
    <span class="button__label"><slot /></span>
  </RouterLink>
  <button v-else :type="type" :class="classes" :disabled="isDisabled" :aria-busy="loading">
    <LoaderCircle v-if="loading" class="button__spinner" :size="18" aria-hidden="true" />
    <slot v-else name="icon" />
    <span class="button__label"><slot /></span>
  </button>
</template>

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--touch-target);
  padding: 0 var(--space-5);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.button:active:not(:disabled) {
  transform: translateY(1px);
}

.button--lg {
  min-height: 3.5rem;
  padding: 0 var(--space-6);
  font-size: var(--font-size-lg);
  font-stretch: var(--font-stretch-wide);
}

.button--block {
  width: 100%;
}

.button--primary {
  color: var(--color-text-on-accent);
  background-color: var(--color-accent);
}

.button--primary:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
}

.button--secondary {
  color: var(--color-text);
  background-color: var(--color-surface-raised);
  border-color: var(--color-border-strong);
}

.button--secondary:hover:not(:disabled) {
  border-color: var(--color-accent);
}

.button--ghost {
  color: var(--color-text-muted);
  background-color: transparent;
}

.button--ghost:hover:not(:disabled) {
  color: var(--color-text);
  background-color: var(--color-surface-raised);
}

.button--danger {
  color: var(--color-danger);
  background-color: var(--color-danger-soft);
  border-color: var(--color-danger-soft);
}

.button--danger:hover:not(:disabled) {
  border-color: var(--color-danger);
}

.button__spinner {
  animation: spin 900ms linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

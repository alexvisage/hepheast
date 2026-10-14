<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Libellé obligatoire : le bouton n'affiche qu'une icône */
    label: string
    variant?: 'ghost' | 'secondary'
    disabled?: boolean
  }>(),
  { variant: 'ghost' },
)
</script>

<template>
  <button
    type="button"
    class="icon-button"
    :class="`icon-button--${variant}`"
    :aria-label="label"
    :title="label"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.icon-button {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  width: var(--touch-target);
  height: var(--touch-target);
  padding: 0;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  transition:
    color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.icon-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.icon-button:hover:not(:disabled) {
  color: var(--color-text);
  background-color: var(--color-surface-raised);
}

.icon-button--secondary {
  background-color: var(--color-surface-raised);
  border-color: var(--color-border);
}
</style>

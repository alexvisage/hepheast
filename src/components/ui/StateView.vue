<script setup lang="ts">
import { computed } from 'vue'
import { Anvil, CircleAlert, LoaderCircle, WifiOff } from '@lucide/vue'

export type StateKind = 'loading' | 'empty' | 'error' | 'offline'

/**
 * États d'une zone de contenu (CDC §9.3) : chargement, vide, erreur, hors ligne.
 * Un état vide invite toujours à une action, un état d'erreur dit quoi faire.
 */
const props = withDefaults(
  defineProps<{
    kind: StateKind
    title?: string
    description?: string
  }>(),
  { title: undefined, description: undefined },
)

const defaults: Record<StateKind, string> = {
  loading: 'Chargement…',
  empty: 'Rien pour le moment',
  error: 'Le chargement a échoué',
  offline: 'Vous êtes hors ligne',
}

const icon = computed(
  () => ({ loading: LoaderCircle, empty: Anvil, error: CircleAlert, offline: WifiOff })[props.kind],
)
</script>

<template>
  <div
    class="state"
    :class="`state--${kind}`"
    :role="kind === 'error' ? 'alert' : 'status'"
    :aria-busy="kind === 'loading' ? true : undefined"
  >
    <component :is="icon" class="state__icon" :size="32" aria-hidden="true" />
    <p class="state__title">{{ title ?? defaults[kind] }}</p>
    <p v-if="description" class="state__description">{{ description }}</p>
    <div v-if="$slots.default" class="state__actions"><slot /></div>
  </div>
</template>

<style scoped>
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-7) var(--space-5);
  text-align: center;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
}

.state--loading {
  border-style: solid;
  border-color: var(--color-border);
}

.state__icon {
  margin-bottom: var(--space-2);
  color: var(--color-text-subtle);
}

.state--loading .state__icon {
  animation: spin 900ms linear infinite;
}

.state--error .state__icon {
  color: var(--color-danger);
}

.state--empty .state__icon {
  color: var(--color-accent);
}

.state__title {
  font-weight: var(--font-weight-semibold);
  font-stretch: var(--font-stretch-wide);
}

.state__description {
  max-width: 36ch;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.state__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

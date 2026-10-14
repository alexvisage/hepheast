<script setup lang="ts">
import { computed } from 'vue'
import { CloudCheck, CloudUpload, TriangleAlert, WifiOff } from '@lucide/vue'

export type SyncState = 'saved' | 'pending' | 'error' | 'offline'

/** Indicateur de sauvegarde de la séance active (CDC §14) */
const props = defineProps<{ state: SyncState }>()

const config = computed(
  () =>
    ({
      saved: { icon: CloudCheck, label: 'Sauvegardé' },
      pending: { icon: CloudUpload, label: 'Sauvegarde en attente' },
      error: { icon: TriangleAlert, label: 'Échec de la sauvegarde' },
      offline: { icon: WifiOff, label: 'Hors ligne, saisie conservée' },
    })[props.state],
)
</script>

<template>
  <span class="sync" :class="`sync--${state}`" role="status">
    <component :is="config.icon" :size="16" aria-hidden="true" />
    {{ config.label }}
  </span>
</template>

<style scoped>
.sync {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  background-color: var(--color-surface-raised);
  border-radius: var(--radius-full);
}

.sync--saved {
  color: var(--color-success);
  background-color: var(--color-success-soft);
}

.sync--pending,
.sync--offline {
  color: var(--color-warning);
  background-color: var(--color-warning-soft);
}

.sync--error {
  color: var(--color-danger);
  background-color: var(--color-danger-soft);
}
</style>

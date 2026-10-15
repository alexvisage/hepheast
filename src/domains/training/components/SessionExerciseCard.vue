<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDown, ArrowUp, Trash2 } from '@lucide/vue'

import IconButton from '@/components/ui/IconButton.vue'
import { formatPrescription } from '@/domains/programs/prescription'
import { formatSet, formatShortDate } from '@/services/format'
import type { Exercise, LastPerformance, WorkoutExercise } from '@/types/domain'

/**
 * Un exercice de la séance en cours (CDC §4.2) : identité, dernière
 * performance connue, réordonnancement et retrait. Les séries sont fournies
 * par l'appelant via l'emplacement par défaut (saisie : SCRUM-139).
 */
const props = defineProps<{
  entry: WorkoutExercise
  exercise?: Exercise
  lastPerformance?: LastPerformance | null
  /** Rang affiché, de 1 à total */
  position: number
  total: number
}>()

const emit = defineEmits<{ move: [direction: -1 | 1]; remove: [] }>()

const name = computed(() => props.exercise?.name ?? 'Exercice')

/** « mar. 7 oct. · 8 × 80 kg · 8 × 80 kg » */
const lastLine = computed(() => {
  const last = props.lastPerformance
  if (!last) return null
  const sets = last.sets.map((set) => formatSet(set.reps, set.load, set.unit))
  return [formatShortDate(last.date), ...sets].join(' · ')
})
</script>

<template>
  <article class="session-exercise">
    <header class="session-exercise__header">
      <div class="session-exercise__identity">
        <h3 class="session-exercise__name">{{ name }}</h3>
        <p class="session-exercise__rank text-muted">Exercice {{ position }} sur {{ total }}</p>
      </div>
      <div class="session-exercise__actions">
        <IconButton :label="`Monter ${name}`" :disabled="position === 1" @click="emit('move', -1)">
          <ArrowUp :size="20" aria-hidden="true" />
        </IconButton>
        <IconButton
          :label="`Descendre ${name}`"
          :disabled="position === total"
          @click="emit('move', 1)"
        >
          <ArrowDown :size="20" aria-hidden="true" />
        </IconButton>
        <IconButton :label="`Retirer ${name} de la séance`" @click="emit('remove')">
          <Trash2 :size="20" aria-hidden="true" />
        </IconButton>
      </div>
    </header>

    <p v-if="entry.prescription" class="session-exercise__prescription">
      <span class="session-exercise__tag">Prévu</span>
      {{ formatPrescription(entry.prescription) }}
    </p>
    <p v-if="entry.prescription?.note" class="session-exercise__consigne text-muted">
      {{ entry.prescription.note }}
    </p>

    <p v-if="lastLine" class="session-exercise__last text-muted">
      <span class="visually-hidden">Dernière fois : </span>{{ lastLine }}
    </p>

    <slot :entry="entry" />
  </article>
</template>

<style scoped>
.session-exercise {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.session-exercise__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
}

.session-exercise__identity {
  min-width: 0;
}

.session-exercise__name {
  font-size: var(--font-size-lg);
}

.session-exercise__rank,
.session-exercise__last,
.session-exercise__prescription,
.session-exercise__consigne {
  font-size: var(--font-size-sm);
}

.session-exercise__prescription {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-accent-text);
}

.session-exercise__tag {
  padding: 0 var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-on-accent);
  background-color: var(--color-accent);
  border-radius: var(--radius-full);
}

.session-exercise__actions {
  display: flex;
  flex-shrink: 0;
  gap: var(--space-1);
}
</style>

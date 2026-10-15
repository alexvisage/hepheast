<script setup lang="ts">
import { computed } from 'vue'

import BaseCard from '@/components/ui/BaseCard.vue'
import { formatPrescription } from '@/domains/programs/prescription'
import { formatDuration, formatNumber, formatSet } from '@/services/format'
import type { Exercise, Id, SetKind, SetStatus, WorkoutSession } from '@/types/domain'

import { summarizeExercise, summarizeSession } from '../metrics'

/**
 * Contenu d'une séance achevée : totaux puis détail série par série.
 * Partagé par le récapitulatif de fin de séance (SCRUM-151) et la page
 * d'historique d'une séance (SCRUM-156).
 */
const props = withDefaults(
  defineProps<{
    session: WorkoutSession
    exercises: Record<Id, Exercise>
    /** Affiche le type de chaque série et ses notes (consultation d'une séance passée) */
    detailed?: boolean
  }>(),
  { detailed: false },
)

const KIND_LABELS: Record<SetKind, string> = {
  warmup: 'Échauffement',
  working: 'Travail',
  drop: 'Dégressive',
}

const STATUS_LABELS: Record<SetStatus, string> = {
  planned: 'non réalisée',
  done: 'réalisée',
  skipped: 'ignorée',
}

const summary = computed(() => summarizeSession(props.session))

const recap = computed(() =>
  props.session.exercises.map((entry) => ({
    entry,
    name: props.exercises[entry.exerciseId]?.name ?? 'Exercice',
    ...summarizeExercise(entry),
  })),
)
</script>

<template>
  <div class="recap">
    <dl class="recap__stats">
      <div class="recap__stat">
        <dt>Durée</dt>
        <dd class="figure">{{ formatDuration(summary.durationSeconds) }}</dd>
      </div>
      <div class="recap__stat">
        <dt>Exercices</dt>
        <dd class="figure">{{ summary.exerciseCount }}</dd>
      </div>
      <div class="recap__stat">
        <dt>Séries</dt>
        <dd class="figure">{{ summary.completedSets }}</dd>
      </div>
      <div class="recap__stat">
        <dt>Répétitions</dt>
        <dd class="figure">{{ summary.totalReps }}</dd>
      </div>
      <div class="recap__stat recap__stat--wide">
        <dt>Volume total</dt>
        <dd class="figure">{{ formatNumber(summary.volumeKg) }} kg</dd>
      </div>
    </dl>

    <p class="recap__definition text-muted">
      Volume = somme des charges × répétitions des séries de travail validées. Les échauffements et
      les séries ignorées n'y entrent pas.
    </p>

    <BaseCard title="Exercice par exercice">
      <ul class="recap__exercises" role="list">
        <li v-for="item in recap" :key="item.entry.id" class="recap__exercise">
          <div class="recap__exercise-head">
            <h3 class="recap__exercise-name">{{ item.name }}</h3>
            <p class="text-muted recap__exercise-meta">
              {{ item.completedSets }} série{{ item.completedSets > 1 ? 's' : '' }} ·
              {{ formatNumber(item.volumeKg) }} kg
            </p>
          </div>

          <p v-if="detailed && item.entry.prescription" class="recap__prescription">
            <span class="recap__planned">Prévu</span>
            {{ formatPrescription(item.entry.prescription) }}
          </p>
          <p v-if="detailed && item.entry.note" class="recap__note">{{ item.entry.note }}</p>

          <ul class="recap__sets" role="list">
            <li
              v-for="(set, index) in item.entry.sets"
              :key="set.id"
              class="recap__set"
              :class="{ 'recap__set--skipped': set.status !== 'done' }"
            >
              <span class="recap__set-index text-muted">{{ index + 1 }}</span>
              <span class="figure">{{ formatSet(set.reps, set.load, set.unit) }}</span>
              <span v-if="detailed && set.kind !== 'working'" class="recap__tag">
                {{ KIND_LABELS[set.kind] }}
              </span>
              <span v-if="set.status !== 'done'" class="recap__tag">
                {{ STATUS_LABELS[set.status] }}
              </span>
              <span v-if="detailed && set.note" class="recap__set-note">{{ set.note }}</span>
            </li>
          </ul>
        </li>
      </ul>
    </BaseCard>
  </div>
</template>

<style scoped>
.recap {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.recap__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.recap__stat {
  padding: var(--space-3);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.recap__stat--wide {
  grid-column: 1 / -1;
}

.recap__stat dt {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.recap__stat dd {
  font-size: var(--font-size-2xl);
  color: var(--color-accent-text);
}

.recap__definition {
  font-size: var(--font-size-sm);
}

.recap__exercises {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.recap__exercise-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.recap__exercise-name {
  font-size: var(--font-size-md);
}

.recap__exercise-meta {
  font-size: var(--font-size-sm);
}

.recap__sets {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.recap__set {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.recap__set--skipped {
  color: var(--color-text-subtle);
}

.recap__set-index {
  min-width: 1rem;
}

.recap__tag {
  padding: 0 var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
}

.recap__prescription {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-accent-text);
}

.recap__planned {
  padding: 0 var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-on-accent);
  background-color: var(--color-accent);
  border-radius: var(--radius-full);
}

.recap__note,
.recap__set-note {
  color: var(--color-text-muted);
  white-space: pre-line;
}

.recap__note {
  margin-bottom: var(--space-2);
  font-size: var(--font-size-sm);
}

.recap__set-note {
  flex-basis: 100%;
  padding-left: var(--space-5);
  font-size: var(--font-size-xs);
}
</style>

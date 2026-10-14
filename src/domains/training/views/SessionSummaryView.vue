<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StateView from '@/components/ui/StateView.vue'
import { services } from '@/services'
import { formatDuration, formatNumber, formatSet, formatShortDate } from '@/services/format'
import type { Exercise, Id, WorkoutSession } from '@/types/domain'

import { summarizeExercise, summarizeSession } from '../metrics'

/**
 * Récapitulatif de la séance qui vient d'être enregistrée (CDC §4.2, AC-04).
 *
 * L'écran relit la dernière séance terminée dans les services plutôt que de
 * dépendre d'un état en mémoire : il reste juste après un rechargement.
 * Les records personnels viendront s'afficher ici avec SCRUM-184.
 */
const FEELING_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Très facile',
  2: 'Facile',
  3: 'Correct',
  4: 'Difficile',
  5: 'Épuisant',
}

const session = ref<WorkoutSession | null>(null)
const exercises = ref<Record<Id, Exercise>>({})
const status = ref<'loading' | 'ready' | 'empty' | 'error'>('loading')

const summary = computed(() => (session.value ? summarizeSession(session.value) : null))

/** Un exercice par ligne, avec son nom et son propre total */
const recap = computed(() =>
  (session.value?.exercises ?? []).map((entry) => ({
    entry,
    name: exercises.value[entry.exerciseId]?.name ?? 'Exercice',
    ...summarizeExercise(entry),
  })),
)

async function load() {
  status.value = 'loading'
  try {
    const [last] = await services.workouts.listCompletedSessions(1)
    if (!last) {
      status.value = 'empty'
      return
    }
    const ids = [...new Set(last.exercises.map((entry) => entry.exerciseId))]
    const found = await Promise.all(ids.map((id) => services.exercises.getExercise(id)))
    exercises.value = Object.fromEntries(found.map((exercise) => [exercise.id, exercise]))
    session.value = last
    status.value = 'ready'
  } catch {
    status.value = 'error'
  }
}

onMounted(load)
</script>

<template>
  <div class="recap">
    <StateView v-if="status === 'loading'" kind="loading" />

    <StateView
      v-else-if="status === 'empty'"
      kind="empty"
      title="Aucune séance terminée"
      description="Termine une séance pour voir son récapitulatif ici."
    >
      <BaseButton :to="{ name: 'training' }">Démarrer une séance</BaseButton>
    </StateView>

    <StateView
      v-else-if="status === 'error'"
      kind="error"
      description="Le récapitulatif n’a pas pu être chargé. Ta séance est bien enregistrée."
    >
      <BaseButton variant="secondary" @click="load">Réessayer</BaseButton>
    </StateView>

    <template v-else-if="session && summary">
      <header class="recap__header">
        <p class="recap__eyebrow">Séance enregistrée</p>
        <h1>{{ session.title }}</h1>
        <p class="text-muted">{{ formatShortDate(session.endedAt ?? session.startedAt) }}</p>
      </header>

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
        Volume = somme des charges × répétitions des séries de travail validées. Les échauffements
        et les séries ignorées n'y entrent pas.
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
            <ul class="recap__sets" role="list">
              <li
                v-for="(set, index) in item.entry.sets"
                :key="set.id"
                class="recap__set"
                :class="{ 'recap__set--skipped': set.status !== 'done' }"
              >
                <span class="text-muted">{{ index + 1 }}</span>
                <span class="figure">{{ formatSet(set.reps, set.load, set.unit) }}</span>
                <span v-if="set.status !== 'done'" class="recap__skipped">ignorée</span>
              </li>
            </ul>
          </li>
        </ul>
      </BaseCard>

      <BaseCard v-if="session.feeling || session.note" title="Ton ressenti">
        <p v-if="session.feeling">{{ FEELING_LABELS[session.feeling] }}</p>
        <p v-if="session.note" class="recap__note">{{ session.note }}</p>
      </BaseCard>

      <footer class="recap__footer">
        <BaseButton :to="{ name: 'dashboard' }" size="lg" block
          >Retour au tableau de bord</BaseButton
        >
        <BaseButton :to="{ name: 'training' }" variant="ghost" block>Entraînement</BaseButton>
      </footer>
    </template>
  </div>
</template>

<style scoped>
.recap {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 40rem;
}

.recap__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.recap__eyebrow {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-success);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
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
  margin-top: calc(-1 * var(--space-3));
  font-size: var(--font-size-sm);
}

.recap__exercises,
.recap__sets {
  display: flex;
  flex-direction: column;
}

.recap__exercises {
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
  gap: var(--space-1);
}

.recap__set {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  font-size: var(--font-size-sm);
}

.recap__set--skipped {
  color: var(--color-text-subtle);
}

.recap__skipped {
  font-size: var(--font-size-xs);
}

.recap__note {
  color: var(--color-text-muted);
  white-space: pre-line;
}

.recap__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>

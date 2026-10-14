<script setup lang="ts">
import { onMounted, ref } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StateView from '@/components/ui/StateView.vue'
import { services } from '@/services'
import { formatShortDate } from '@/services/format'
import { useSessionStore } from '@/stores/session'
import type { Exercise, Id, WorkoutSession } from '@/types/domain'

import SessionRecap from '../components/SessionRecap.vue'

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

const session = useSessionStore()

const workout = ref<WorkoutSession | null>(null)
const exercises = ref<Record<Id, Exercise>>({})
const status = ref<'loading' | 'ready' | 'empty' | 'error'>('loading')

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
    workout.value = last
    status.value = 'ready'
  } catch {
    status.value = 'error'
  }
}

onMounted(load)
</script>

<template>
  <div class="summary">
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

    <template v-else-if="workout">
      <header class="summary__header">
        <p class="summary__eyebrow">Séance enregistrée</p>
        <h1>{{ workout.title }}</h1>
        <p class="text-muted">
          {{ formatShortDate(workout.endedAt ?? workout.startedAt, session.preferences?.timeZone) }}
        </p>
      </header>

      <SessionRecap :session="workout" :exercises="exercises" />

      <BaseCard v-if="workout.feeling || workout.note" title="Ton ressenti">
        <p v-if="workout.feeling">{{ FEELING_LABELS[workout.feeling] }}</p>
        <p v-if="workout.note" class="summary__note">{{ workout.note }}</p>
      </BaseCard>

      <footer class="summary__footer">
        <BaseButton :to="{ name: 'dashboard' }" size="lg" block>
          Retour au tableau de bord
        </BaseButton>
        <BaseButton :to="{ name: 'history' }" variant="ghost" block>Voir l’historique</BaseButton>
      </footer>
    </template>
  </div>
</template>

<style scoped>
.summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 44rem;
}

.summary__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.summary__eyebrow {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-success);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
}

.summary__note {
  color: var(--color-text-muted);
  white-space: pre-line;
}

.summary__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>

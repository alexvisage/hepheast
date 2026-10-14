<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronLeft } from '@lucide/vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StateView from '@/components/ui/StateView.vue'
import { services, ServiceError } from '@/services'
import { formatLongDate, dateKey } from '@/services/dates'
import { formatTime } from '@/services/format'
import { useSessionStore } from '@/stores/session'
import type { Exercise, Id, WorkoutSession } from '@/types/domain'

import SessionRecap from '../components/SessionRecap.vue'

/**
 * Détail d'une séance passée (CDC §4.3, AC-04) : toutes les séries avec les
 * valeurs exactes saisies, type et notes compris.
 *
 * La prescription du programme n'est pas encore distinguée du réalisé : les
 * programmes n'existent pas dans le modèle (phase 3, SCRUM-13).
 */
const props = defineProps<{ id: string }>()

const session = useSessionStore()

const workout = ref<WorkoutSession | null>(null)
const exercises = ref<Record<Id, Exercise>>({})
const status = ref<'loading' | 'ready' | 'not-found' | 'error'>('loading')

const FEELING_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Très facile',
  2: 'Facile',
  3: 'Correct',
  4: 'Difficile',
  5: 'Épuisant',
}

async function load(id: string) {
  status.value = 'loading'
  try {
    const found = await services.workouts.getSession(id)
    const ids = [...new Set(found.exercises.map((entry) => entry.exerciseId))]
    const catalogue = await Promise.all(ids.map((item) => services.exercises.getExercise(item)))
    exercises.value = Object.fromEntries(catalogue.map((exercise) => [exercise.id, exercise]))
    workout.value = found
    status.value = 'ready'
  } catch (error) {
    status.value =
      error instanceof ServiceError && error.code === 'not-found' ? 'not-found' : 'error'
  }
}

watch(() => props.id, load, { immediate: true })
</script>

<template>
  <div class="detail">
    <RouterLink :to="{ name: 'history' }" class="detail__back">
      <ChevronLeft :size="18" aria-hidden="true" />
      Historique
    </RouterLink>

    <StateView v-if="status === 'loading'" kind="loading" />

    <StateView
      v-else-if="status === 'not-found'"
      kind="empty"
      title="Cette séance n’existe pas"
      description="Elle a peut-être été supprimée."
    >
      <BaseButton :to="{ name: 'history' }" variant="secondary">Voir l’historique</BaseButton>
    </StateView>

    <StateView
      v-else-if="status === 'error'"
      kind="error"
      description="La séance n’a pas pu être chargée."
    >
      <BaseButton variant="secondary" @click="load(id)">Réessayer</BaseButton>
    </StateView>

    <template v-else-if="workout">
      <header class="detail__header">
        <h1>{{ workout.title }}</h1>
        <p class="text-muted">
          {{ formatLongDate(dateKey(workout.startedAt, session.preferences?.timeZone)) }}, à
          {{ formatTime(workout.startedAt, session.preferences?.timeZone) }}
          <template v-if="workout.status === 'abandoned'"> · séance abandonnée</template>
        </p>
      </header>

      <SessionRecap :session="workout" :exercises="exercises" detailed />

      <BaseCard v-if="workout.feeling || workout.note" title="Ressenti et note">
        <p v-if="workout.feeling">{{ FEELING_LABELS[workout.feeling] }}</p>
        <p v-if="workout.note" class="detail__note">{{ workout.note }}</p>
      </BaseCard>
    </template>
  </div>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 44rem;
}

.detail__back {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-decoration: none;
}

.detail__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.detail__note {
  color: var(--color-text-muted);
  white-space: pre-line;
}
</style>

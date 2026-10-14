<script setup lang="ts">
import { ref, watch } from 'vue'
import { ChevronLeft } from '@lucide/vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StateView from '@/components/ui/StateView.vue'
import { services, ServiceError } from '@/services'
import { formatSet, formatShortDate } from '@/services/format'
import type { Exercise, LastPerformance } from '@/types/domain'

import { useCatalogStore } from '../catalogStore'
import FavoriteToggle from '../components/FavoriteToggle.vue'

const props = defineProps<{ id: string }>()

const catalog = useCatalogStore()

const exercise = ref<Exercise | null>(null)
const lastPerformance = ref<LastPerformance | null>(null)
const status = ref<'loading' | 'ready' | 'not-found' | 'error'>('loading')

async function load(id: string) {
  status.value = 'loading'
  try {
    await catalog.load()
    const [found, last] = await Promise.all([
      services.exercises.getExercise(id),
      services.workouts.getLastPerformance(id),
    ])
    exercise.value = found
    lastPerformance.value = last
    status.value = 'ready'
  } catch (error) {
    status.value =
      error instanceof ServiceError && error.code === 'not-found' ? 'not-found' : 'error'
  }
}

watch(() => props.id, load, { immediate: true })
</script>

<template>
  <div class="exercise-detail">
    <RouterLink :to="{ name: 'exercises' }" class="exercise-detail__back">
      <ChevronLeft :size="18" aria-hidden="true" />
      Exercices
    </RouterLink>

    <StateView v-if="status === 'loading'" kind="loading" />
    <StateView
      v-else-if="status === 'not-found'"
      kind="empty"
      title="Cet exercice n’existe pas"
      description="Il a peut-être été renommé ou retiré du catalogue."
    >
      <BaseButton :to="{ name: 'exercises' }" variant="secondary">Voir le catalogue</BaseButton>
    </StateView>
    <StateView
      v-else-if="status === 'error'"
      kind="error"
      description="Vérifiez votre connexion puis réessayez."
    >
      <BaseButton variant="secondary" @click="load(id)">Réessayer</BaseButton>
    </StateView>

    <template v-else-if="exercise">
      <header class="exercise-detail__header">
        <div class="exercise-detail__title">
          <h1>{{ exercise.name }}</h1>
          <p v-if="exercise.aliases.length" class="text-muted">
            Aussi appelé {{ exercise.aliases.join(', ') }}
          </p>
        </div>
        <FavoriteToggle :exercise="exercise" />
      </header>

      <dl class="facts">
        <div class="facts__item">
          <dt>Muscles principaux</dt>
          <dd class="tags">
            <span
              v-for="muscleId in exercise.primaryMuscleIds"
              :key="muscleId"
              class="tag tag--primary"
            >
              {{ catalog.muscleName(muscleId) }}
            </span>
          </dd>
        </div>
        <div v-if="exercise.secondaryMuscleIds.length" class="facts__item">
          <dt>Muscles secondaires</dt>
          <dd class="tags">
            <span v-for="muscleId in exercise.secondaryMuscleIds" :key="muscleId" class="tag">
              {{ catalog.muscleName(muscleId) }}
            </span>
          </dd>
        </div>
        <div class="facts__item">
          <dt>Équipement</dt>
          <dd>{{ catalog.equipmentName(exercise.equipmentId) }}</dd>
        </div>
      </dl>

      <div class="exercise-detail__grid">
        <BaseCard title="Consignes">
          <p v-if="exercise.description">{{ exercise.description }}</p>
          <ol v-if="exercise.instructions.length" class="steps">
            <li v-for="step in exercise.instructions" :key="step">{{ step }}</li>
          </ol>
          <p v-if="!exercise.description && !exercise.instructions.length" class="text-muted">
            Les consignes détaillées de cet exercice arrivent bientôt.
          </p>
        </BaseCard>

        <BaseCard title="Ta dernière fois">
          <template v-if="lastPerformance">
            <p class="text-muted">{{ formatShortDate(lastPerformance.date) }}</p>
            <ul class="last-sets" role="list">
              <li v-for="(set, index) in lastPerformance.sets" :key="index" class="last-sets__item">
                <span class="text-muted">Série {{ index + 1 }}</span>
                <span class="last-sets__value">{{ formatSet(set.reps, set.load, set.unit) }}</span>
              </li>
            </ul>
          </template>
          <p v-else class="text-muted">
            Pas encore réalisé. Ajoute-le à ta prochaine séance pour suivre ta progression.
          </p>
        </BaseCard>
      </div>
    </template>
  </div>
</template>

<style scoped>
.exercise-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.exercise-detail__back {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-decoration: none;
}

.exercise-detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.exercise-detail__title {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4) var(--space-6);
  margin: 0;
}

.facts__item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.facts dt {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.facts dd {
  margin: 0;
  font-weight: var(--font-weight-medium);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tag {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-sm);
  background-color: var(--color-surface-raised);
  border-radius: var(--radius-full);
}

.tag--primary {
  color: var(--color-accent-text);
  background-color: var(--color-accent-soft);
}

.exercise-detail__grid {
  display: grid;
  gap: var(--space-4);
}

@media (width >= 64rem) {
  .exercise-detail__grid {
    grid-template-columns: 3fr 2fr;
    align-items: start;
  }
}

.steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding-left: var(--space-5);
}

.steps li::marker {
  font-weight: var(--font-weight-bold);
  color: var(--color-accent-text);
}

.last-sets {
  display: flex;
  flex-direction: column;
}

.last-sets__item {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
}

.last-sets__value {
  font-weight: var(--font-weight-semibold);
}
</style>

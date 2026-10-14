<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from '@lucide/vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import StateView from '@/components/ui/StateView.vue'
import { useCatalogStore } from '@/domains/exercises/catalogStore'
import { services, type SessionFilters } from '@/services'
import { addDays, todayKey } from '@/services/dates'
import { formatDuration, formatNumber, formatShortDate } from '@/services/format'
import { useSessionStore } from '@/stores/session'
import type { WorkoutSession } from '@/types/domain'

import { summarizeSession } from '../metrics'

/**
 * Historique des séances (CDC §4.3).
 *
 * Les filtres se combinent et repartent de la première page ; les séances
 * s'ajoutent par paquets plutôt que toutes d'un coup, un historique de
 * plusieurs années n'a pas à tenir dans une seule réponse.
 */
const PERIODS = [
  { value: '7', label: '7 jours' },
  { value: '30', label: '30 jours' },
  { value: '90', label: '90 jours' },
  { value: '365', label: '1 an' },
  { value: 'all', label: 'Tout' },
] as const

const catalog = useCatalogStore()
const session = useSessionStore()

const period = ref<(typeof PERIODS)[number]['value']>('all')
const exerciseId = ref('')
const muscleId = ref('')
const equipmentId = ref('')

const sessions = ref<WorkoutSession[]>([])
const cursor = ref<string | undefined>(undefined)
const status = ref<'loading' | 'ready' | 'error'>('loading')
const loadingMore = ref(false)

const exercises = ref<{ id: string; name: string }[]>([])

const filters = computed<SessionFilters>(() => ({
  ...(period.value === 'all'
    ? {}
    : { from: addDays(todayKey(session.preferences?.timeZone), -Number(period.value)) }),
  ...(exerciseId.value ? { exerciseId: exerciseId.value } : {}),
  ...(muscleId.value ? { muscleId: muscleId.value } : {}),
  ...(equipmentId.value ? { equipmentId: equipmentId.value } : {}),
}))

const rows = computed(() =>
  sessions.value.map((item) => ({
    session: item,
    totals: summarizeSession(item),
  })),
)

const hasFilters = computed(
  () =>
    period.value !== 'all' ||
    exerciseId.value !== '' ||
    muscleId.value !== '' ||
    equipmentId.value !== '',
)

let requestId = 0

async function load() {
  const current = ++requestId
  status.value = 'loading'
  try {
    const page = await services.workouts.listSessions({ filters: filters.value })
    if (current !== requestId) return
    sessions.value = page.sessions
    cursor.value = page.nextCursor
    status.value = 'ready'
  } catch {
    if (current === requestId) status.value = 'error'
  }
}

async function loadMore() {
  if (!cursor.value) return
  loadingMore.value = true
  try {
    const page = await services.workouts.listSessions({
      filters: filters.value,
      cursor: cursor.value,
    })
    sessions.value = [...sessions.value, ...page.sessions]
    cursor.value = page.nextCursor
  } catch {
    status.value = 'error'
  } finally {
    loadingMore.value = false
  }
}

function resetFilters() {
  period.value = 'all'
  exerciseId.value = ''
  muscleId.value = ''
  equipmentId.value = ''
}

watch(filters, load)

onMounted(async () => {
  await Promise.all([catalog.load(), load()])
  exercises.value = (await services.exercises.listExercises()).map(({ id, name }) => ({ id, name }))
})
</script>

<template>
  <div class="history">
    <header class="history__header">
      <h1>Historique</h1>
      <p class="text-muted">Toutes tes séances, de la plus récente à la plus ancienne.</p>
    </header>

    <div class="history__filters" role="search">
      <label class="select">
        <span class="select__label">Période</span>
        <select v-model="period" class="select__field">
          <option v-for="option in PERIODS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <label class="select">
        <span class="select__label">Exercice</span>
        <select v-model="exerciseId" class="select__field">
          <option value="">Tous</option>
          <option v-for="exercise in exercises" :key="exercise.id" :value="exercise.id">
            {{ exercise.name }}
          </option>
        </select>
      </label>
      <label class="select">
        <span class="select__label">Muscle</span>
        <select v-model="muscleId" class="select__field">
          <option value="">Tous</option>
          <option v-for="muscle in catalog.muscles" :key="muscle.id" :value="muscle.id">
            {{ muscle.name }}
          </option>
        </select>
      </label>
      <label class="select">
        <span class="select__label">Équipement</span>
        <select v-model="equipmentId" class="select__field">
          <option value="">Tout</option>
          <option v-for="item in catalog.equipment" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
      </label>
    </div>

    <StateView v-if="status === 'loading' && sessions.length === 0" kind="loading" />

    <StateView
      v-else-if="status === 'error'"
      kind="error"
      description="L’historique n’a pas pu être chargé."
    >
      <BaseButton variant="secondary" @click="load">Réessayer</BaseButton>
    </StateView>

    <StateView
      v-else-if="sessions.length === 0 && hasFilters"
      kind="empty"
      title="Aucune séance sur cette sélection"
      description="Élargis la période ou retire un filtre."
    >
      <BaseButton variant="secondary" @click="resetFilters">Effacer les filtres</BaseButton>
    </StateView>

    <StateView
      v-else-if="sessions.length === 0"
      kind="empty"
      title="Aucune séance enregistrée"
      description="Ta première séance terminée apparaîtra ici."
    >
      <BaseButton :to="{ name: 'training' }">Démarrer une séance</BaseButton>
    </StateView>

    <template v-else>
      <p class="history__count text-muted" aria-live="polite">
        {{ sessions.length }} séance{{ sessions.length > 1 ? 's' : '' }} affichée{{
          sessions.length > 1 ? 's' : ''
        }}
      </p>

      <ul class="history__list" role="list" :aria-busy="status === 'loading'">
        <li v-for="row in rows" :key="row.session.id" class="history__item">
          <RouterLink
            :to="{ name: 'session-detail', params: { id: row.session.id } }"
            class="history__row"
          >
            <span class="history__text">
              <span class="history__title">
                {{ row.session.title }}
                <span v-if="row.session.status === 'abandoned'" class="history__badge">
                  abandonnée
                </span>
              </span>
              <span class="history__meta">
                {{ formatShortDate(row.session.startedAt, session.preferences?.timeZone) }} ·
                {{ formatDuration(row.totals.durationSeconds) }} ·
                {{ row.totals.completedSets }} série{{ row.totals.completedSets > 1 ? 's' : '' }} ·
                {{ formatNumber(row.totals.volumeKg) }} kg
              </span>
            </span>
            <ChevronRight class="history__icon" :size="20" aria-hidden="true" />
          </RouterLink>
        </li>
      </ul>

      <BaseButton v-if="cursor" variant="secondary" block :loading="loadingMore" @click="loadMore">
        Charger les séances précédentes
      </BaseButton>
    </template>
  </div>
</template>

<style scoped>
.history {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 44rem;
}

.history__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.history__filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: var(--space-2);
}

.select {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.select__label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
}

.select__field {
  width: 100%;
  min-height: var(--touch-target);
  padding: 0 var(--space-3);
  background-color: var(--color-bg-sunken);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
}

.select__field:focus-visible {
  border-color: var(--color-focus);
}

.history__count {
  min-height: 1.5em;
  font-size: var(--font-size-sm);
}

.history__list {
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.history__list[aria-busy='true'] {
  opacity: 0.6;
}

.history__item + .history__item {
  border-top: 1px solid var(--color-border);
}

.history__row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 4rem;
  padding: var(--space-3) var(--space-4);
  color: inherit;
  text-decoration: none;
}

.history__row:hover {
  background-color: var(--color-surface-raised);
}

.history__row:focus-visible {
  box-shadow: inset 0 0 0 2px var(--color-focus);
}

.history__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.history__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: var(--font-weight-semibold);
}

.history__badge {
  padding: 0 var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
}

.history__meta {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.history__icon {
  flex-shrink: 0;
  color: var(--color-text-subtle);
}
</style>

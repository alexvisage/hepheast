<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import LineChart from '@/components/charts/LineChart.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StateView from '@/components/ui/StateView.vue'
import { services } from '@/services'
import { addDays, formatDayMonth, formatLongDate, todayKey } from '@/services/dates'
import { formatNumber, formatSet } from '@/services/format'
import { useSessionStore } from '@/stores/session'
import type { Exercise, WorkoutSession } from '@/types/domain'

import {
  buildExerciseProgress,
  metricValue,
  METRIC_LABELS,
  ONE_REP_MAX_FORMULA,
  ONE_REP_MAX_SOURCE,
  type ProgressMetric,
} from '../exerciseProgress'

/**
 * Progression par exercice (CDC §5.2, AC-05).
 *
 * Le graphique est décoratif : le tableau sous la courbe porte les mêmes
 * valeurs et reste la seule source lisible au clavier et au lecteur d'écran
 * (CDC §9.2). Toute estimation est libellée « estimé » avec sa formule.
 */
const PERIODS = [
  { value: '7', label: '7 jours' },
  { value: '30', label: '30 jours' },
  { value: '90', label: '90 jours' },
  { value: '365', label: '1 an' },
  { value: 'all', label: 'Tout' },
] as const

const METRICS: ProgressMetric[] = ['maxLoad', 'volume', 'oneRepMax']

const session = useSessionStore()

const exercises = ref<Exercise[]>([])
const sessions = ref<WorkoutSession[]>([])
const exerciseId = ref('')
const period = ref<(typeof PERIODS)[number]['value']>('90')
const metric = ref<ProgressMetric>('maxLoad')
const status = ref<'loading' | 'ready' | 'error'>('loading')

const timeZone = computed(() => session.preferences?.timeZone)

const points = computed(() =>
  exerciseId.value
    ? buildExerciseProgress(sessions.value, exerciseId.value, { timeZone: timeZone.value })
    : [],
)

const exerciseName = computed(
  () => exercises.value.find((item) => item.id === exerciseId.value)?.name ?? '',
)

/** Les trois mesures sont des kilogrammes : charge, volume et estimation */
const UNIT = 'kg'

const labels = computed(() => points.value.map((point) => formatDayMonth(point.day)))
const values = computed(() => points.value.map((point) => metricValue(point, metric.value)))

/** Progrès brut entre la première et la dernière séance de la période */
const trend = computed(() => {
  const first = values.value[0]
  const last = values.value.at(-1)
  if (first === undefined || last === undefined || values.value.length < 2) return null
  return {
    delta: Math.round((last - first) * 10) / 10,
    percent: Math.round(((last - first) / first) * 100),
  }
})

const best = computed(() => (values.value.length > 0 ? Math.max(...values.value) : null))

let requestId = 0

async function load() {
  const current = ++requestId
  status.value = 'loading'
  try {
    const from =
      period.value === 'all' ? undefined : addDays(todayKey(timeZone.value), -Number(period.value))
    const page = await services.workouts.listSessions({
      filters: {
        ...(from ? { from } : {}),
        ...(exerciseId.value ? { exerciseId: exerciseId.value } : {}),
        status: 'completed',
      },
      limit: 300,
    })
    if (current !== requestId) return
    sessions.value = page.sessions
    status.value = 'ready'
  } catch {
    if (current === requestId) status.value = 'error'
  }
}

watch([exerciseId, period], load)

onMounted(async () => {
  try {
    const catalogue = await services.exercises.listExercises()
    exercises.value = catalogue.filter((exercise) => exercise.loaded)
    // Premier exercice avec un historique, pour ne pas ouvrir sur un écran vide
    const recent = await services.workouts.listSessions({
      filters: { status: 'completed' },
      limit: 20,
    })
    const trained = recent.sessions.flatMap((item) => item.exercises.map((e) => e.exerciseId))
    exerciseId.value = trained[0] ?? exercises.value[0]?.id ?? ''
  } catch {
    status.value = 'error'
    return
  }
  await load()
})
</script>

<template>
  <div class="progress">
    <header class="progress__header">
      <h1>Progression</h1>
      <p class="text-muted">L’évolution de tes charges, exercice par exercice.</p>
    </header>

    <div class="progress__filters" role="search">
      <label class="select">
        <span class="select__label">Exercice</span>
        <select v-model="exerciseId" class="select__field">
          <option v-for="exercise in exercises" :key="exercise.id" :value="exercise.id">
            {{ exercise.name }}
          </option>
        </select>
      </label>
      <label class="select">
        <span class="select__label">Période</span>
        <select v-model="period" class="select__field">
          <option v-for="option in PERIODS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <label class="select">
        <span class="select__label">Mesure</span>
        <select v-model="metric" class="select__field">
          <option v-for="option in METRICS" :key="option" :value="option">
            {{ METRIC_LABELS[option] }}
          </option>
        </select>
      </label>
    </div>

    <StateView v-if="status === 'loading'" kind="loading" />

    <StateView
      v-else-if="status === 'error'"
      kind="error"
      description="La progression n’a pas pu être chargée."
    >
      <BaseButton variant="secondary" @click="load">Réessayer</BaseButton>
    </StateView>

    <StateView
      v-else-if="points.length === 0"
      kind="empty"
      title="Pas encore de données"
      description="Réalise cet exercice au moins une fois pour voir sa courbe. Les séries d’échauffement ne comptent pas."
    >
      <BaseButton :to="{ name: 'training' }">Démarrer une séance</BaseButton>
    </StateView>

    <template v-else>
      <BaseCard :title="`${METRIC_LABELS[metric]} — ${exerciseName}`">
        <template #actions>
          <p v-if="best !== null" class="progress__best text-muted">
            Record de la période : {{ formatNumber(best) }} {{ UNIT }}
          </p>
        </template>

        <LineChart
          :labels="labels"
          :values="values"
          :unit="UNIT"
          :series-name="METRIC_LABELS[metric]"
        />

        <p v-if="trend" class="progress__trend">
          {{ trend.delta >= 0 ? '+' : '' }}{{ formatNumber(trend.delta) }} {{ UNIT }}
          <span class="text-muted">
            ({{ trend.percent >= 0 ? '+' : '' }}{{ trend.percent }} %) entre la première et la
            dernière séance de la période
          </span>
        </p>

        <table class="table">
          <caption class="table__caption">
            {{
              METRIC_LABELS[metric]
            }}
            de
            {{
              exerciseName
            }}, séance par séance. Ce tableau reprend les valeurs de la courbe.
          </caption>
          <thead>
            <tr>
              <th scope="col">Séance</th>
              <th scope="col">Meilleure série</th>
              <th scope="col">Charge max</th>
              <th scope="col">Volume</th>
              <th scope="col">1RM estimé</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="point in points" :key="point.sessionId">
              <th scope="row" class="table__day">{{ formatLongDate(point.day) }}</th>
              <td class="figure">{{ formatSet(point.topSet.reps, point.topSet.loadKg, 'kg') }}</td>
              <td class="figure">{{ formatNumber(point.maxLoadKg) }} kg</td>
              <td class="figure">{{ formatNumber(point.volumeKg) }} kg</td>
              <td class="figure">{{ formatNumber(point.estimatedOneRepMaxKg) }} kg</td>
            </tr>
          </tbody>
        </table>

        <p class="progress__note text-muted">
          Le 1RM est <strong>estimé</strong>, jamais mesuré : {{ ONE_REP_MAX_FORMULA }} ({{
            ONE_REP_MAX_SOURCE
          }}). Il s’éloigne du réel au-delà d’une dizaine de répétitions.
        </p>
      </BaseCard>
    </template>
  </div>
</template>

<style scoped>
.progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 48rem;
}

.progress__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.progress__filters {
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

.progress__best {
  font-size: var(--font-size-sm);
}

.progress__trend {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-accent-text);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table__caption {
  margin-bottom: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-align: left;
}

.table th,
.table td {
  padding: var(--space-2) var(--space-1);
  font-size: var(--font-size-sm);
  text-align: right;
  border-bottom: 1px solid var(--color-border);
}

.table thead th {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
}

.table th:first-child,
.table td:first-child {
  text-align: left;
}

.table__day {
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.progress__note {
  font-size: var(--font-size-xs);
}
</style>

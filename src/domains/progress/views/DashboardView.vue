<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { CalendarDays, Dumbbell, Play, Star } from '@lucide/vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StateView from '@/components/ui/StateView.vue'
import { useActiveSessionStore } from '@/domains/training/activeSessionStore'
import { summarizeSession } from '@/domains/training/metrics'
import { services } from '@/services'
import { formatDayMonth, formatWeekdayShort, formatWeekRange, todayKey } from '@/services/dates'
import { formatDuration, formatNumber, formatShortDate } from '@/services/format'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@/stores/toasts'
import type { ScheduledWorkout, WorkoutSession } from '@/types/domain'

import { summarizeWeek, weeklyStreak } from '../dashboard'

/**
 * Tableau de bord (CDC §4.1) : ce qu'il y a à faire maintenant, puis où on
 * en est. Tout est calculé à partir des séances terminées : aucune donnée
 * n'est dupliquée, l'endpoint agrégé (SCRUM-177) prendra la place des appels.
 */
const active = useActiveSessionStore()
const session = useSessionStore()
const toasts = useToastStore()
const router = useRouter()

const sessions = ref<WorkoutSession[]>([])
const next = ref<ScheduledWorkout | null>(null)
const status = ref<'loading' | 'ready' | 'error'>('loading')
const starting = ref(false)

const preferences = computed(() => session.preferences)
const today = computed(() => todayKey(preferences.value?.timeZone))
const weekOptions = computed(() => ({
  weekStartsOn: preferences.value?.weekStartsOn ?? 1,
  timeZone: preferences.value?.timeZone,
}))

const week = computed(() => summarizeWeek(sessions.value, today.value, weekOptions.value))
const streak = computed(() => weeklyStreak(sessions.value, today.value, weekOptions.value))
const last = computed(() => sessions.value[0] ?? null)
const lastTotals = computed(() => (last.value ? summarizeSession(last.value) : null))
const isNewcomer = computed(() => status.value === 'ready' && sessions.value.length === 0)

async function load() {
  status.value = 'loading'
  try {
    const [completed, scheduled] = await Promise.all([
      services.workouts.listCompletedSessions(60),
      services.schedule.getNextScheduled(todayKey(session.preferences?.timeZone)),
    ])
    sessions.value = completed
    next.value = scheduled
    status.value = 'ready'
  } catch {
    status.value = 'error'
  }
}

/** Démarre la séance planifiée et la rattache à son créneau */
async function startScheduled(scheduled: ScheduledWorkout) {
  starting.value = true
  try {
    const started = await active.start(scheduled.title)
    await services.schedule.linkSession(scheduled.id, started.id)
    await router.push({ name: 'active-session' })
  } catch {
    toasts.show('La séance n’a pas pu être démarrée. Réessaie.', 'danger')
  } finally {
    starting.value = false
  }
}

onMounted(() => {
  if (!active.loaded) void active.load()
  void load()
})
</script>

<template>
  <div class="dashboard">
    <header class="dashboard__header">
      <h1>Tableau de bord</h1>
      <p class="text-muted">
        {{ session.user ? `Salut ${session.user.displayName},` : 'Salut,' }} voilà où tu en es.
      </p>
    </header>

    <StateView v-if="status === 'loading'" kind="loading" />

    <StateView
      v-else-if="status === 'error'"
      kind="error"
      description="Tes données n’ont pas pu être chargées."
    >
      <BaseButton variant="secondary" @click="load">Réessayer</BaseButton>
    </StateView>

    <template v-else>
      <!-- Reprise : toujours en premier, c'est l'action la plus urgente -->
      <BaseCard v-if="active.session" title="Séance en cours" class="dashboard__resume">
        <p class="text-muted">
          {{ active.session.title }}, commencée
          {{ formatShortDate(active.session.startedAt, preferences?.timeZone) }}
        </p>
        <BaseButton :to="{ name: 'active-session' }" size="lg" block>
          <template #icon><Play :size="20" aria-hidden="true" /></template>
          Reprendre la séance
        </BaseButton>
      </BaseCard>

      <BaseCard v-else-if="next" title="Prochaine séance">
        <p>
          <strong>{{ next.title }}</strong>
          <span class="text-muted"> · {{ formatDayMonth(next.date) }}</span>
        </p>
        <BaseButton size="lg" block :loading="starting" @click="startScheduled(next)">
          <template #icon><Play :size="20" aria-hidden="true" /></template>
          Démarrer
        </BaseButton>
      </BaseCard>

      <StateView
        v-else-if="isNewcomer"
        kind="empty"
        title="Ta première séance t’attend"
        description="Démarre une séance libre : tu ajouteras tes exercices au fur et à mesure. Tes statistiques se rempliront ensuite tout seules."
      >
        <BaseButton :to="{ name: 'training' }" size="lg">Démarrer une séance</BaseButton>
      </StateView>

      <BaseCard v-else title="Rien de planifié">
        <p class="text-muted">
          Aucune séance prévue. Lance une séance libre ou planifie ta semaine au calendrier.
        </p>
        <div class="dashboard__pair">
          <BaseButton :to="{ name: 'training' }">Démarrer une séance</BaseButton>
          <BaseButton :to="{ name: 'calendar' }" variant="secondary">Planifier</BaseButton>
        </div>
      </BaseCard>

      <BaseCard title="Cette semaine">
        <template #actions>
          <p class="text-muted dashboard__range">
            {{ formatWeekRange(today, weekOptions.weekStartsOn) }}
          </p>
        </template>

        <ul class="dashboard__days" role="list">
          <li v-for="day in week.days" :key="day.key" class="dashboard__day">
            <span class="dashboard__day-name">{{ formatWeekdayShort(day.key) }}</span>
            <span
              class="dashboard__dot"
              :class="{
                'dashboard__dot--done': day.sessions > 0,
                'dashboard__dot--today': day.key === today,
              }"
            >
              <span class="visually-hidden">
                {{ day.sessions > 0 ? `${day.sessions} séance` : 'aucune séance' }}
              </span>
            </span>
          </li>
        </ul>

        <dl class="dashboard__stats">
          <div class="dashboard__stat">
            <dt>Séances</dt>
            <dd class="figure">{{ week.sessions }}</dd>
          </div>
          <div class="dashboard__stat">
            <dt>Séries</dt>
            <dd class="figure">{{ week.completedSets }}</dd>
          </div>
          <div class="dashboard__stat">
            <dt>Volume</dt>
            <dd class="figure">{{ formatNumber(week.volumeKg) }} kg</dd>
          </div>
          <div class="dashboard__stat">
            <dt>Temps</dt>
            <dd class="figure">{{ formatDuration(week.durationSeconds) }}</dd>
          </div>
        </dl>

        <p v-if="streak > 1" class="dashboard__streak">
          {{ streak }} semaines d’affilée avec au moins une séance. Continue.
        </p>
      </BaseCard>

      <BaseCard v-if="last && lastTotals" title="Dernière séance">
        <p>
          <strong>{{ last.title }}</strong>
          <span class="text-muted">
            · {{ formatShortDate(last.startedAt, preferences?.timeZone) }}
          </span>
        </p>
        <p class="text-muted dashboard__last">
          {{ lastTotals.completedSets }} série{{ lastTotals.completedSets > 1 ? 's' : '' }} ·
          {{ lastTotals.totalReps }} répétition{{ lastTotals.totalReps > 1 ? 's' : '' }} ·
          {{ formatNumber(lastTotals.volumeKg) }} kg ·
          {{ formatDuration(lastTotals.durationSeconds) }}
        </p>
        <BaseButton :to="{ name: 'session-summary' }" variant="secondary">
          Voir le récapitulatif
        </BaseButton>
      </BaseCard>

      <nav class="dashboard__shortcuts" aria-label="Raccourcis">
        <RouterLink :to="{ name: 'training' }" class="shortcut">
          <Dumbbell :size="20" aria-hidden="true" />
          Entraînement
        </RouterLink>
        <RouterLink :to="{ name: 'exercises', query: { favoris: '1' } }" class="shortcut">
          <Star :size="20" aria-hidden="true" />
          Mes favoris
        </RouterLink>
        <RouterLink :to="{ name: 'calendar' }" class="shortcut">
          <CalendarDays :size="20" aria-hidden="true" />
          Calendrier
        </RouterLink>
      </nav>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 44rem;
}

.dashboard__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.dashboard__resume {
  border-color: var(--color-accent);
}

.dashboard__pair {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.dashboard__range {
  font-size: var(--font-size-sm);
}

.dashboard__days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--space-2);
}

.dashboard__day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.dashboard__day-name {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.dashboard__dot {
  width: 1.5rem;
  height: 1.5rem;
  background-color: var(--color-bg-sunken);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
}

.dashboard__dot--done {
  background-color: var(--color-success);
  border-color: var(--color-success);
}

.dashboard__dot--today {
  box-shadow: 0 0 0 2px var(--color-accent);
}

.dashboard__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.dashboard__stat dt {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.dashboard__stat dd {
  font-size: var(--font-size-xl);
  color: var(--color-accent-text);
}

.dashboard__streak {
  font-size: var(--font-size-sm);
  color: var(--color-success);
}

.dashboard__last {
  font-size: var(--font-size-sm);
}

.dashboard__shortcuts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: var(--space-2);
}

.shortcut {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--touch-target);
  padding: 0 var(--space-4);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  text-decoration: none;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.shortcut:hover {
  border-color: var(--color-accent);
}

@media (width >= 48rem) {
  .dashboard__stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>

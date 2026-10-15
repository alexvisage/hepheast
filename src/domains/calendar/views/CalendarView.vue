<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  MoveRight,
} from '@lucide/vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import IconButton from '@/components/ui/IconButton.vue'
import StateView from '@/components/ui/StateView.vue'
import { summarizeWeek, weeklyStreak } from '@/domains/progress/dashboard'
import { useActiveSessionStore } from '@/domains/training/activeSessionStore'
import { services } from '@/services'
import {
  addDays,
  addMonths,
  formatLongDate,
  formatMonthYear,
  formatWeekRange,
  monthGrid,
  startOfMonth,
  todayKey,
  weekDays,
  type DateKey,
} from '@/services/dates'
import { formatNumber } from '@/services/format'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@/stores/toasts'
import type { ScheduledWorkout, WorkoutSession } from '@/types/domain'

import CalendarGrid from '../components/CalendarGrid.vue'
import CalendarPlanDialog from '../components/CalendarPlanDialog.vue'
import { buildCalendar, STATUS_LABELS, type CalendarEntry, type CalendarStatus } from '../schedule'

/**
 * Calendrier des séances (CDC §4.5, AC-06) : vues mois, semaine et jour,
 * navigation, statuts lisibles et résumé de la semaine.
 *
 * Les jours viennent de `services/dates` : fuseau de l'utilisateur et premier
 * jour de semaine sont respectés sans calcul local.
 */
type CalendarMode = 'month' | 'week' | 'day'

const MODES: { value: CalendarMode; label: string }[] = [
  { value: 'month', label: 'Mois' },
  { value: 'week', label: 'Semaine' },
  { value: 'day', label: 'Jour' },
]

const LEGEND: { status: CalendarStatus; icon: unknown }[] = [
  { status: 'planned', icon: CalendarClock },
  { status: 'done', icon: CircleCheck },
  { status: 'missed', icon: CircleAlert },
  { status: 'moved', icon: MoveRight },
]

const active = useActiveSessionStore()
const session = useSessionStore()
const toasts = useToastStore()
const router = useRouter()

const mode = ref<CalendarMode>('month')
const planning = ref(false)
const moving = ref<CalendarEntry | null>(null)
const cancelling = ref<CalendarEntry | null>(null)
const confirmingCancel = ref(false)
const selected = ref<DateKey>(todayKey(session.preferences?.timeZone))
const scheduled = ref<ScheduledWorkout[]>([])
const sessions = ref<WorkoutSession[]>([])
const status = ref<'loading' | 'ready' | 'error'>('loading')

const timeZone = computed(() => session.preferences?.timeZone)
const weekStartsOn = computed(() => session.preferences?.weekStartsOn ?? 1)
const today = computed(() => todayKey(timeZone.value))

const visibleDays = computed(() => {
  if (mode.value === 'day') return [selected.value]
  if (mode.value === 'week') return weekDays(selected.value, weekStartsOn.value)
  return monthGrid(selected.value, weekStartsOn.value)
})

const rangeLabel = computed(() => {
  if (mode.value === 'day') return formatLongDate(selected.value)
  if (mode.value === 'week') return formatWeekRange(selected.value, weekStartsOn.value)
  return formatMonthYear(selected.value)
})

const entries = computed(() =>
  buildCalendar({
    scheduled: scheduled.value,
    sessions: sessions.value,
    today: today.value,
    timeZone: timeZone.value,
  }),
)

const dayEntries = computed(() => entries.value.get(selected.value) ?? [])

const week = computed(() =>
  summarizeWeek(sessions.value, selected.value, {
    weekStartsOn: weekStartsOn.value,
    timeZone: timeZone.value,
  }),
)
const streak = computed(() =>
  weeklyStreak(sessions.value, today.value, {
    weekStartsOn: weekStartsOn.value,
    timeZone: timeZone.value,
  }),
)

let requestId = 0

async function load() {
  const current = ++requestId
  const days = visibleDays.value
  const from = days[0] ?? selected.value
  const to = days.at(-1) ?? selected.value
  status.value = 'loading'
  try {
    const [plans, page] = await Promise.all([
      services.schedule.listScheduled({ from, to }),
      // La semaine affichée peut déborder du mois : on charge la plage visible
      services.workouts.listSessions({ filters: { from, to }, limit: 200 }),
    ])
    if (current !== requestId) return
    scheduled.value = plans
    sessions.value = page.sessions
    status.value = 'ready'
  } catch {
    if (current === requestId) status.value = 'error'
  }
}

/** Décale d'un mois, d'une semaine ou d'un jour selon la vue */
function shift(direction: -1 | 1) {
  if (mode.value === 'month') selected.value = addMonths(selected.value, direction)
  else if (mode.value === 'week') selected.value = addDays(selected.value, direction * 7)
  else selected.value = addDays(selected.value, direction)
}

function goToToday() {
  selected.value = today.value
}

// --- Depuis le calendrier vers la séance ---------------------------------

/** Démarre la séance du créneau et la rattache, pour que le suivi reste juste */
async function start(entry: CalendarEntry) {
  if (active.session) {
    toasts.show('Une séance est déjà en cours.', 'warning')
    await router.push({ name: 'active-session' })
    return
  }
  try {
    if (entry.scheduledId) {
      await active.startFromScheduled({
        id: entry.scheduledId,
        title: entry.title,
        ...(entry.programId ? { programId: entry.programId } : {}),
        ...(entry.programDayId ? { programDayId: entry.programDayId } : {}),
      })
    } else {
      await active.start(entry.title)
    }
    await router.push({ name: 'active-session' })
  } catch {
    toasts.show('La séance n’a pas pu être démarrée. Réessaie.', 'danger')
  }
}

// --- Planification ------------------------------------------------------

async function plan({ date, title }: { date: DateKey; title: string }) {
  try {
    await services.schedule.createScheduled({ date, title })
    selected.value = date
    await load()
    toasts.show(`${title} planifiée le ${formatLongDate(date)}`, 'success')
  } catch {
    toasts.show('La séance n’a pas pu être planifiée. Réessaie.', 'danger')
  }
}

async function move({ date }: { date: DateKey }) {
  const entry = moving.value
  moving.value = null
  if (!entry?.scheduledId) return
  try {
    await services.schedule.moveScheduled(entry.scheduledId, date)
    selected.value = date
    await load()
    toasts.show(`${entry.title} déplacée au ${formatLongDate(date)}`, 'success')
  } catch {
    toasts.show('La séance n’a pas pu être déplacée. Réessaie.', 'danger')
  }
}

/** Décalage rapide d'un jour, sans passer par le dialogue */
async function nudge(entry: CalendarEntry, direction: -1 | 1) {
  if (!entry.scheduledId) return
  moving.value = entry
  await move({ date: addDays(entry.day, direction) })
}

function requestCancel(entry: CalendarEntry) {
  cancelling.value = entry
  confirmingCancel.value = true
}

async function confirmCancel() {
  const entry = cancelling.value
  cancelling.value = null
  if (!entry?.scheduledId) return
  try {
    await services.schedule.cancelScheduled(entry.scheduledId)
    await load()
    toasts.show(`${entry.title} annulée`)
  } catch {
    toasts.show('La séance n’a pas pu être annulée. Réessaie.', 'danger')
  }
}

watch([visibleDays], load)

onMounted(() => {
  if (!active.loaded) void active.load()
  void load()
})
</script>

<template>
  <div class="calendar">
    <header class="calendar__header">
      <h1>Calendrier</h1>
      <p class="text-muted">Ce qui est prévu, ce qui est fait.</p>
    </header>

    <div class="calendar__toolbar">
      <div class="calendar__modes" role="group" aria-label="Vue du calendrier">
        <button
          v-for="option in MODES"
          :key="option.value"
          type="button"
          class="mode"
          :class="{ 'mode--active': mode === option.value }"
          :aria-pressed="mode === option.value"
          @click="mode = option.value"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="calendar__nav">
        <IconButton label="Période précédente" variant="secondary" @click="shift(-1)">
          <ChevronLeft :size="20" aria-hidden="true" />
        </IconButton>
        <p class="calendar__range" aria-live="polite">{{ rangeLabel }}</p>
        <IconButton label="Période suivante" variant="secondary" @click="shift(1)">
          <ChevronRight :size="20" aria-hidden="true" />
        </IconButton>
        <BaseButton variant="ghost" @click="goToToday">Aujourd’hui</BaseButton>
      </div>
    </div>

    <StateView
      v-if="status === 'error'"
      kind="error"
      description="Le calendrier n’a pas pu être chargé."
    >
      <BaseButton variant="secondary" @click="load">Réessayer</BaseButton>
    </StateView>

    <template v-else>
      <CalendarGrid
        v-if="mode !== 'day'"
        :days="visibleDays"
        :entries="entries"
        :selected="selected"
        :today="today"
        :month="startOfMonth(selected)"
        :week-starts-on="weekStartsOn"
        :compact="mode === 'week'"
        @select="selected = $event"
      />

      <ul class="legend" role="list">
        <li v-for="item in LEGEND" :key="item.status" class="legend__item">
          <component :is="item.icon" :size="16" :class="`legend__icon--${item.status}`" />
          {{ STATUS_LABELS[item.status] }}
        </li>
      </ul>

      <BaseCard :title="formatLongDate(selected)">
        <template #actions>
          <BaseButton variant="secondary" @click="planning = true">Planifier</BaseButton>
        </template>

        <ul v-if="dayEntries.length > 0" class="day" role="list">
          <li v-for="entry in dayEntries" :key="entry.id" class="day__item">
            <span class="day__text">
              <span class="day__title">{{ entry.title }}</span>
              <span class="day__status">
                {{ STATUS_LABELS[entry.status] }}
                <template v-if="entry.movedFrom">
                  · déplacée du {{ formatLongDate(entry.movedFrom) }}
                </template>
                <template v-if="entry.abandoned"> · abandonnée</template>
              </span>
            </span>

            <span class="day__actions">
              <BaseButton v-if="entry.status !== 'done'" @click="start(entry)">Démarrer</BaseButton>
              <BaseButton
                v-if="entry.sessionId"
                variant="secondary"
                :to="{ name: 'session-detail', params: { id: entry.sessionId } }"
              >
                Voir le détail
              </BaseButton>

              <template v-if="entry.scheduledId && entry.status !== 'done'">
                <IconButton :label="`Avancer ${entry.title} d’un jour`" @click="nudge(entry, -1)">
                  <ChevronLeft :size="20" aria-hidden="true" />
                </IconButton>
                <IconButton :label="`Reporter ${entry.title} d’un jour`" @click="nudge(entry, 1)">
                  <ChevronRight :size="20" aria-hidden="true" />
                </IconButton>
                <BaseButton variant="ghost" @click="moving = entry">Déplacer</BaseButton>
                <BaseButton variant="ghost" @click="requestCancel(entry)">Annuler</BaseButton>
              </template>
            </span>
          </li>
        </ul>
        <p v-else class="text-muted">Rien de prévu ce jour-là.</p>
      </BaseCard>

      <BaseCard title="Cette semaine">
        <dl class="calendar__stats">
          <div class="calendar__stat">
            <dt>Séances</dt>
            <dd class="figure">{{ week.sessions }}</dd>
          </div>
          <div class="calendar__stat">
            <dt>Volume</dt>
            <dd class="figure">{{ formatNumber(week.volumeKg) }} kg</dd>
          </div>
          <div class="calendar__stat">
            <dt>Régularité</dt>
            <dd class="figure">{{ streak }} sem.</dd>
          </div>
        </dl>
        <p class="text-muted calendar__hint">
          Régularité : semaines consécutives avec au moins une séance, en comptant celle en cours.
        </p>
      </BaseCard>
    </template>

    <CalendarPlanDialog v-model:open="planning" :day="selected" @submit="plan" />

    <CalendarPlanDialog
      :open="moving !== null"
      :day="moving?.day ?? selected"
      :title="moving?.title"
      mode="move"
      @submit="move"
      @update:open="moving = $event ? moving : null"
    />

    <ConfirmDialog
      v-model:open="confirmingCancel"
      title="Annuler cette séance planifiée ?"
      confirm-label="Annuler la séance"
      cancel-label="Garder"
      danger
      @confirm="confirmCancel"
      @cancel="cancelling = null"
    >
      {{ cancelling?.title }} disparaîtra du calendrier. Les séances déjà réalisées ne sont pas
      touchées.
    </ConfirmDialog>
  </div>
</template>

<style scoped>
.calendar {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 48rem;
}

.calendar__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.calendar__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.calendar__modes {
  display: flex;
  background-color: var(--color-bg-sunken);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.mode {
  min-height: 2.5rem;
  padding: 0 var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  background: transparent;
  border: 0;
}

.mode--active {
  color: var(--color-text-on-accent);
  background-color: var(--color-accent);
}

.calendar__nav {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.calendar__range {
  min-width: 10rem;
  font-weight: var(--font-weight-semibold);
  text-align: center;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.legend__item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.legend__icon--planned {
  color: var(--color-accent-text);
}

.legend__icon--done {
  color: var(--color-success);
}

.legend__icon--missed {
  color: var(--color-danger);
}

.legend__icon--moved {
  color: var(--color-warning);
}

.day {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.day__item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.day__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.day__title {
  font-weight: var(--font-weight-semibold);
}

.day__status {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.day__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
}

.calendar__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.calendar__stat dt {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.calendar__stat dd {
  font-size: var(--font-size-xl);
  color: var(--color-accent-text);
}

.calendar__hint {
  font-size: var(--font-size-xs);
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { CalendarClock, CircleAlert, CircleCheck, MoveRight } from '@lucide/vue'

import {
  formatDayNumber,
  formatLongDate,
  formatWeekdayShort,
  isSameMonth,
  type DateKey,
  type WeekStart,
} from '@/services/dates'

import { STATUS_LABELS, type CalendarEntry, type CalendarStatus } from '../schedule'

/**
 * Grille de jours du calendrier (CDC §4.5).
 *
 * Chaque statut porte une icône **et** un libellé : la couleur seule ne
 * suffit pas (CDC §9.2). Un jour est un bouton : on le choisit au doigt
 * comme au clavier, et la liste détaillée s'affiche sous la grille.
 */
const props = defineProps<{
  days: DateKey[]
  entries: Map<DateKey, CalendarEntry[]>
  selected: DateKey
  today: DateKey
  /** Mois affiché, pour griser les jours débordants */
  month: DateKey
  weekStartsOn: WeekStart
  /** Une semaine seule : les cases peuvent être plus hautes */
  compact?: boolean
}>()

defineEmits<{ select: [day: DateKey] }>()

const STATUS_ICONS: Record<CalendarStatus, unknown> = {
  planned: CalendarClock,
  done: CircleCheck,
  missed: CircleAlert,
  moved: MoveRight,
}

/** En-têtes de colonnes, pris sur la première semaine affichée */
const weekdays = computed(() => props.days.slice(0, 7))

function entriesOf(day: DateKey): CalendarEntry[] {
  return props.entries.get(day) ?? []
}

/** « mercredi 14 octobre 2026, 1 séance planifiée » */
function dayLabel(day: DateKey): string {
  const items = entriesOf(day)
  if (items.length === 0) return `${formatLongDate(day)}, rien de prévu`
  const detail = items.map(
    (entry) => `${entry.title}, ${STATUS_LABELS[entry.status].toLowerCase()}`,
  )
  return `${formatLongDate(day)}, ${detail.join(' ; ')}`
}
</script>

<template>
  <div class="grid" :class="{ 'grid--compact': compact }">
    <div class="grid__weekdays" aria-hidden="true">
      <span v-for="day in weekdays" :key="day" class="grid__weekday">
        {{ formatWeekdayShort(day) }}
      </span>
    </div>

    <div class="grid__days" role="group">
      <button
        v-for="day in days"
        :key="day"
        type="button"
        class="cell"
        :class="{
          'cell--outside': !isSameMonth(day, month),
          'cell--today': day === today,
          'cell--selected': day === selected,
        }"
        :aria-pressed="day === selected"
        :aria-label="dayLabel(day)"
        @click="$emit('select', day)"
      >
        <span class="cell__number" aria-hidden="true">{{ formatDayNumber(day) }}</span>
        <span class="cell__entries" aria-hidden="true">
          <component
            :is="STATUS_ICONS[entry.status]"
            v-for="entry in entriesOf(day)"
            :key="entry.id"
            :size="compact ? 18 : 14"
            :class="`cell__icon cell__icon--${entry.status}`"
          />
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.grid__weekdays,
.grid__days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--space-1);
}

.grid__weekday {
  padding-bottom: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-align: center;
}

.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  min-height: 3rem;
  padding: var(--space-1);
  color: var(--color-text);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.grid--compact .cell {
  min-height: 5rem;
}

.cell:hover {
  border-color: var(--color-accent);
}

.cell--outside {
  color: var(--color-text-subtle);
  background-color: transparent;
}

.cell--today {
  --cell-number-color: var(--color-accent-text);
  --cell-number-weight: var(--font-weight-bold);
}

.cell--selected {
  border-color: var(--color-accent);
  box-shadow: inset 0 0 0 1px var(--color-accent);
}

.cell__number {
  font-size: var(--font-size-sm);
  font-weight: var(--cell-number-weight, var(--font-weight-regular));
  color: var(--cell-number-color, inherit);
}

.cell__entries {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px;
  min-height: 1rem;
}

.cell__icon--planned {
  color: var(--color-accent-text);
}

.cell__icon--done {
  color: var(--color-success);
}

.cell__icon--missed {
  color: var(--color-danger);
}

.cell__icon--moved {
  color: var(--color-warning);
}
</style>

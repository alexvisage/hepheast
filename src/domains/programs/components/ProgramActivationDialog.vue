<script setup lang="ts">
import { computed, ref, useId, useTemplateRef, watch } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import { formatDayMonth, todayKey } from '@/services/dates'
import { useSessionStore } from '@/stores/session'
import type { Program } from '@/types/domain'

import { planProgram, WEEKDAY_LABELS, type ActivationInput } from '../activation'

/**
 * Assistant d'activation d'un programme (CDC §6.2) : date de début, jours
 * d'entraînement et horizon de planification.
 *
 * L'aperçu annonce exactement ce qui sera créé avant de valider : on ne
 * remplit pas le calendrier de quelqu'un par surprise.
 */
const props = defineProps<{ program: Program | null }>()

const emit = defineEmits<{ submit: [value: ActivationInput] }>()

const open = defineModel<boolean>('open', { default: false })

const WEEK_CHOICES = [1, 2, 4, 8, 12]

const session = useSessionStore()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const headingId = useId()

const startDate = ref(todayKey(session.preferences?.timeZone))
const weekdays = ref<number[]>([1, 3, 5])
const weeks = ref(4)

const days = computed(
  () =>
    props.program?.versions.find((version) => version.version === props.program?.currentVersion)
      ?.days ?? [],
)

const planned = computed(() =>
  planProgram(days.value, {
    startDate: startDate.value,
    weekdays: weekdays.value,
    weeks: weeks.value,
  }),
)

const summary = computed(() => {
  const first = planned.value[0]
  const last = planned.value.at(-1)
  if (!first || !last) return null
  return {
    count: planned.value.length,
    from: formatDayMonth(first.date),
    to: formatDayMonth(last.date),
  }
})

watch(
  [open, dialog],
  ([isOpen, element]) => {
    if (!element) return
    if (isOpen) {
      startDate.value =
        props.program?.schedule?.startDate ?? todayKey(session.preferences?.timeZone)
      weekdays.value = [...(props.program?.schedule?.weekdays ?? [1, 3, 5])]
      weeks.value = 4
      if (!element.open) element.showModal()
    } else if (element.open) {
      element.close()
    }
  },
  { flush: 'post', immediate: true },
)

function toggle(day: number) {
  weekdays.value = weekdays.value.includes(day)
    ? weekdays.value.filter((item) => item !== day)
    : [...weekdays.value, day].sort()
}

function cancel() {
  open.value = false
}

function submit() {
  if (planned.value.length === 0) return
  emit('submit', {
    startDate: startDate.value,
    weekdays: [...weekdays.value],
    weeks: weeks.value,
  })
  open.value = false
}
</script>

<template>
  <dialog ref="dialog" class="activation" :aria-labelledby="headingId" @cancel.prevent="cancel">
    <form v-if="open" class="activation__panel" @submit.prevent="submit">
      <h2 :id="headingId" class="activation__title">Activer {{ program?.title }}</h2>

      <label class="activation__field">
        <span class="activation__label">Date de début</span>
        <input v-model="startDate" class="activation__date" type="date" required />
      </label>

      <fieldset class="activation__group">
        <legend class="activation__label">Jours d’entraînement</legend>
        <div class="activation__weekdays">
          <label v-for="day in [1, 2, 3, 4, 5, 6, 0]" :key="day" class="weekday">
            <input type="checkbox" :checked="weekdays.includes(day)" @change="toggle(day)" />
            {{ WEEKDAY_LABELS[day] }}
          </label>
        </div>
      </fieldset>

      <label class="activation__field">
        <span class="activation__label">Planifier d’avance</span>
        <select v-model.number="weeks" class="activation__select">
          <option v-for="choice in WEEK_CHOICES" :key="choice" :value="choice">
            {{ choice }} semaine{{ choice > 1 ? 's' : '' }}
          </option>
        </select>
      </label>

      <p v-if="summary" class="activation__preview">
        {{ summary.count }} séance{{ summary.count > 1 ? 's' : '' }} planifiée{{
          summary.count > 1 ? 's' : ''
        }}, du {{ summary.from }} au {{ summary.to }}.
      </p>
      <p v-else class="activation__warning">
        {{
          days.length === 0
            ? 'Ce programme n’a aucun jour : ajoute-les avant de l’activer.'
            : 'Choisis au moins un jour d’entraînement.'
        }}
      </p>

      <div class="activation__actions">
        <BaseButton variant="ghost" @click="cancel">Annuler</BaseButton>
        <BaseButton type="submit" :disabled="planned.length === 0">Activer</BaseButton>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.activation {
  width: min(28rem, calc(100% - 2 * var(--space-3)));
  padding: 0;
  color: var(--color-text);
  background-color: var(--color-surface-raised);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-overlay);
}

.activation::backdrop {
  background-color: var(--color-backdrop);
}

.activation__panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
}

.activation__title {
  font-size: var(--font-size-lg);
}

.activation__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.activation__group {
  padding: 0;
  border: 0;
}

.activation__label {
  display: block;
  margin-bottom: var(--space-1);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.activation__weekdays {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.weekday {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  min-height: 2.5rem;
  padding: 0 var(--space-2);
  font-size: var(--font-size-sm);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
}

.weekday:has(input:checked) {
  color: var(--color-accent-text);
  border-color: var(--color-accent);
}

.activation__date,
.activation__select {
  width: 100%;
  min-height: var(--touch-target);
  padding: 0 var(--space-3);
  background-color: var(--color-bg-sunken);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
}

.activation__date:focus-visible,
.activation__select:focus-visible {
  border-color: var(--color-focus);
}

.activation__preview {
  font-size: var(--font-size-sm);
  color: var(--color-success);
}

.activation__warning {
  font-size: var(--font-size-sm);
  color: var(--color-warning);
}

.activation__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>

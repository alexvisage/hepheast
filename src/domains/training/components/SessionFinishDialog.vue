<script setup lang="ts">
import { computed, ref, useId, useTemplateRef, watch } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import { formatDuration, formatNumber } from '@/services/format'
import type { WorkoutSession } from '@/types/domain'

import { summarizeSession } from '../metrics'

/**
 * Fin de séance : ce qui a été fait, puis le ressenti et la note (CDC §4.2).
 * Rien n'est enregistré avant la confirmation ; annuler laisse la séance en cours.
 */
const props = defineProps<{ session: WorkoutSession }>()

const emit = defineEmits<{
  confirm: [details: Pick<WorkoutSession, 'note' | 'feeling'>]
  cancel: []
}>()

const open = defineModel<boolean>('open', { default: false })

/** 1 à 5, du plus facile au plus dur (CDC §4.2) */
const FEELINGS: { value: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { value: 1, label: 'Très facile' },
  { value: 2, label: 'Facile' },
  { value: 3, label: 'Correct' },
  { value: 4, label: 'Difficile' },
  { value: 5, label: 'Épuisant' },
]

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const titleId = useId()
const noteId = useId()

const note = ref('')
const feeling = ref<1 | 2 | 3 | 4 | 5 | null>(null)

const summary = computed(() => summarizeSession(props.session))

watch(
  [open, dialog],
  ([isOpen, element]) => {
    if (!element) return
    if (isOpen && !element.open) element.showModal()
    if (!isOpen && element.open) element.close()
  },
  { flush: 'post', immediate: true },
)

function cancel() {
  open.value = false
  emit('cancel')
}

function confirm() {
  emit('confirm', {
    note: note.value.trim() === '' ? undefined : note.value.trim(),
    feeling: feeling.value ?? undefined,
  })
}
</script>

<template>
  <dialog ref="dialog" class="finish" :aria-labelledby="titleId" @cancel.prevent="cancel">
    <div v-if="open" class="finish__panel">
      <h2 :id="titleId" class="finish__title">Terminer la séance</h2>

      <dl class="finish__stats">
        <div class="finish__stat">
          <dt>Durée</dt>
          <dd class="figure">{{ formatDuration(summary.durationSeconds) }}</dd>
        </div>
        <div class="finish__stat">
          <dt>Séries validées</dt>
          <dd class="figure">{{ summary.completedSets }}</dd>
        </div>
        <div class="finish__stat">
          <dt>Répétitions</dt>
          <dd class="figure">{{ summary.totalReps }}</dd>
        </div>
        <div class="finish__stat">
          <dt>Volume</dt>
          <dd class="figure">{{ formatNumber(summary.volumeKg) }} kg</dd>
        </div>
      </dl>

      <fieldset class="finish__feelings">
        <legend class="finish__legend">Ressenti (facultatif)</legend>
        <div class="finish__options">
          <label v-for="option in FEELINGS" :key="option.value" class="finish__option">
            <input v-model="feeling" type="radio" name="feeling" :value="option.value" />
            <span>{{ option.label }}</span>
          </label>
        </div>
      </fieldset>

      <label :for="noteId" class="finish__note">
        <span class="finish__legend">Note de séance (facultative)</span>
        <textarea
          :id="noteId"
          v-model="note"
          class="finish__textarea"
          rows="3"
          placeholder="Énergie, douleurs, matériel occupé…"
        ></textarea>
      </label>

      <div class="finish__actions">
        <BaseButton variant="ghost" @click="cancel">Continuer la séance</BaseButton>
        <BaseButton @click="confirm">Terminer</BaseButton>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.finish {
  width: min(30rem, calc(100% - 2 * var(--space-3)));
  max-height: min(90dvh, 44rem);
  padding: 0;
  color: var(--color-text);
  background-color: var(--color-surface-raised);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-overlay);
}

.finish::backdrop {
  background-color: var(--color-backdrop);
}

.finish__panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
}

.finish__title {
  font-size: var(--font-size-lg);
}

.finish__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.finish__stat dt {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.finish__stat dd {
  font-size: var(--font-size-xl);
  color: var(--color-accent-text);
}

.finish__feelings {
  padding: 0;
  border: 0;
}

.finish__legend {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
}

.finish__options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.finish__option {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  min-height: 2.5rem;
  padding: 0 var(--space-3);
  font-size: var(--font-size-sm);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
}

.finish__option:has(input:checked) {
  color: var(--color-accent-text);
  border-color: var(--color-accent);
}

.finish__textarea {
  width: 100%;
  padding: var(--space-2);
  font-size: var(--font-size-sm);
  background-color: var(--color-bg-sunken);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  resize: vertical;
}

.finish__textarea:focus-visible {
  border-color: var(--color-focus);
}

.finish__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>

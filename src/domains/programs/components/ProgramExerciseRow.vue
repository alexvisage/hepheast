<script setup lang="ts">
import { ArrowDown, ArrowUp, Trash2 } from '@lucide/vue'

import IconButton from '@/components/ui/IconButton.vue'
import NumberStepper from '@/components/ui/NumberStepper.vue'
import type { ProgramExercise } from '@/types/domain'

/**
 * Prescription d'un exercice dans un jour de programme (CDC §6.1) :
 * séries × répétitions, repos, charge cible facultative, tempo et consigne.
 *
 * Composant de présentation : il émet les modifications, l'éditeur les
 * applique à son brouillon.
 */
const props = defineProps<{
  exercise: ProgramExercise
  name: string
  position: number
  total: number
}>()

const emit = defineEmits<{
  update: [patch: Partial<ProgramExercise>]
  move: [direction: -1 | 1]
  remove: []
}>()
</script>

<template>
  <div class="prescription">
    <header class="prescription__header">
      <h4 class="prescription__name">{{ name }}</h4>
      <div class="prescription__actions">
        <IconButton :label="`Monter ${name}`" :disabled="position === 1" @click="emit('move', -1)">
          <ArrowUp :size="18" aria-hidden="true" />
        </IconButton>
        <IconButton
          :label="`Descendre ${name}`"
          :disabled="position === total"
          @click="emit('move', 1)"
        >
          <ArrowDown :size="18" aria-hidden="true" />
        </IconButton>
        <IconButton :label="`Retirer ${name} du jour`" @click="emit('remove')">
          <Trash2 :size="18" aria-hidden="true" />
        </IconButton>
      </div>
    </header>

    <div class="prescription__fields">
      <NumberStepper
        :label="`Séries — ${name}`"
        size="sm"
        :min="1"
        :max="20"
        :model-value="props.exercise.sets"
        @update:model-value="emit('update', { sets: $event ?? 1 })"
      />
      <NumberStepper
        :label="`Répétitions — ${name}`"
        size="sm"
        :min="1"
        :max="100"
        :model-value="props.exercise.reps"
        @update:model-value="emit('update', { reps: $event ?? 1 })"
      />
      <NumberStepper
        :label="`Repos (s) — ${name}`"
        size="sm"
        :step="15"
        :min="0"
        :max="600"
        :model-value="props.exercise.restSeconds ?? null"
        @update:model-value="emit('update', { restSeconds: $event ?? undefined })"
      />
      <NumberStepper
        :label="`Charge cible — ${name}`"
        size="sm"
        unit="kg"
        :step="2.5"
        :min="0"
        :max="500"
        :model-value="props.exercise.targetLoad ?? null"
        @update:model-value="emit('update', { targetLoad: $event ?? undefined })"
      />
    </div>

    <div class="prescription__notes">
      <label class="field">
        <span class="field__label">Tempo</span>
        <input
          class="field__input"
          type="text"
          placeholder="3-1-1"
          :value="props.exercise.tempo ?? ''"
          @input="emit('update', { tempo: ($event.target as HTMLInputElement).value || undefined })"
        />
      </label>
      <label class="field field--wide">
        <span class="field__label">Consigne</span>
        <input
          class="field__input"
          type="text"
          placeholder="Descente contrôlée, pieds ancrés…"
          :value="props.exercise.note ?? ''"
          @input="emit('update', { note: ($event.target as HTMLInputElement).value || undefined })"
        />
      </label>
    </div>
  </div>
</template>

<style scoped>
.prescription {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
  background-color: var(--color-bg-sunken);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.prescription__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.prescription__name {
  font-size: var(--font-size-md);
}

.prescription__actions {
  display: flex;
  flex-shrink: 0;
  gap: var(--space-1);
}

.prescription__fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  gap: var(--space-2);
}

.prescription__notes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
  gap: var(--space-2);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.field--wide {
  grid-column: span 2;
}

.field__label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
}

.field__input {
  width: 100%;
  min-height: var(--touch-target);
  padding: 0 var(--space-3);
  font-size: var(--font-size-sm);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
}

.field__input:focus-visible {
  border-color: var(--color-focus);
}
</style>

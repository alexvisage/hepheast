<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { Ban, Check, CopyPlus, MessageSquare, Trash2 } from '@lucide/vue'

import IconButton from '@/components/ui/IconButton.vue'
import NumberStepper from '@/components/ui/NumberStepper.vue'
import type { SetEntry, SetKind } from '@/types/domain'

/**
 * Saisie d'une série (CDC §4.2) : répétitions, charge, statut, type et note.
 *
 * Composant de présentation : il ne touche pas au store, il décrit la
 * modification demandée et laisse l'appelant l'appliquer.
 * Le pas de charge est volontairement de 2,5 kg (le plus petit disque courant).
 */
const props = defineProps<{
  set: SetEntry
  /** Numéro affiché, de 1 à n */
  index: number
  /** Une série précédente existe : ses valeurs peuvent être reprises */
  canCopyPrevious?: boolean
}>()

const emit = defineEmits<{
  update: [patch: Partial<SetEntry>]
  copyPrevious: []
  toggleDone: []
  toggleSkipped: []
  remove: []
}>()

const KINDS: { value: SetKind; label: string }[] = [
  { value: 'warmup', label: 'Échauffement' },
  { value: 'working', label: 'Travail' },
  { value: 'drop', label: 'Dégressive' },
]

const LOAD_STEP_KG = 2.5

const noteId = useId()
const noteOpen = ref(props.set.note !== undefined)

const done = computed(() => props.set.status === 'done')
const skipped = computed(() => props.set.status === 'skipped')
const loadStep = computed(() => (props.set.unit === 'kg' ? LOAD_STEP_KG : 5))

function toggleNote() {
  noteOpen.value = !noteOpen.value
  // Fermer une note vide la retire : pas de chaîne vide dans la séance
  if (!noteOpen.value && !props.set.note) emit('update', { note: undefined })
}

function setNote(value: string) {
  emit('update', { note: value.trim() === '' ? undefined : value })
}
</script>

<template>
  <div class="set-row" :class="{ 'set-row--done': done, 'set-row--skipped': skipped }">
    <div class="set-row__inputs">
      <p class="set-row__index figure"><span class="visually-hidden">Série </span>{{ index }}</p>
      <NumberStepper
        :label="`Répétitions série ${index}`"
        hide-label
        size="sm"
        :max="100"
        :model-value="set.reps"
        @update:model-value="emit('update', { reps: $event })"
      />
      <NumberStepper
        :label="`Charge série ${index}`"
        hide-label
        size="sm"
        :unit="set.unit"
        :step="loadStep"
        :max="500"
        :model-value="set.load"
        @update:model-value="emit('update', { load: $event })"
      />
      <button
        type="button"
        class="set-row__done"
        :aria-pressed="done"
        :aria-label="`Valider la série ${index}`"
        @click="emit('toggleDone')"
      >
        <Check :size="24" aria-hidden="true" />
      </button>
    </div>

    <div class="set-row__meta">
      <label class="set-row__kind">
        <span class="visually-hidden">Type de la série {{ index }}</span>
        <select
          class="set-row__select"
          :value="set.kind"
          @change="emit('update', { kind: ($event.target as HTMLSelectElement).value as SetKind })"
        >
          <option v-for="kind in KINDS" :key="kind.value" :value="kind.value">
            {{ kind.label }}
          </option>
        </select>
      </label>

      <IconButton
        v-if="canCopyPrevious"
        :label="`Copier la série ${index - 1} dans la série ${index}`"
        @click="emit('copyPrevious')"
      >
        <CopyPlus :size="18" aria-hidden="true" />
      </IconButton>
      <IconButton
        :label="`Ignorer la série ${index}`"
        :aria-pressed="skipped"
        @click="emit('toggleSkipped')"
      >
        <Ban :size="18" aria-hidden="true" />
      </IconButton>
      <IconButton
        :label="`Note de la série ${index}`"
        :aria-expanded="noteOpen"
        :aria-controls="noteId"
        @click="toggleNote"
      >
        <MessageSquare :size="18" aria-hidden="true" />
      </IconButton>
      <IconButton :label="`Supprimer la série ${index}`" @click="emit('remove')">
        <Trash2 :size="18" aria-hidden="true" />
      </IconButton>
    </div>

    <label v-if="noteOpen" :for="noteId" class="set-row__note">
      <span class="visually-hidden">Note de la série {{ index }}</span>
      <textarea
        :id="noteId"
        class="set-row__textarea"
        rows="2"
        placeholder="Ressenti, technique, douleur…"
        :value="set.note ?? ''"
        @input="setNote(($event.target as HTMLTextAreaElement).value)"
      ></textarea>
    </label>
  </div>
</template>

<style scoped>
.set-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background-color: var(--color-bg-sunken);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-border-strong);
  border-radius: var(--radius-md);
}

.set-row--done {
  border-left-color: var(--color-success);
}

.set-row--skipped {
  border-left-color: var(--color-text-subtle);
  opacity: 0.6;
}

.set-row__inputs {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
}

.set-row__index {
  flex: 0 0 1.5rem;
  padding-bottom: var(--space-2);
  font-size: var(--font-size-lg);
  color: var(--color-text-subtle);
  text-align: center;
}

.set-row__inputs :deep(.stepper) {
  flex: 1;
}

.set-row__done {
  display: grid;
  place-items: center;
  flex: 0 0 var(--touch-target);
  min-height: var(--touch-target);
  color: var(--color-text-muted);
  background-color: var(--color-surface-raised);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
}

.set-row__done[aria-pressed='true'] {
  color: var(--color-text-on-accent);
  background-color: var(--color-success);
  border-color: var(--color-success);
}

.set-row__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-1);
}

.set-row__kind {
  flex: 1;
  min-width: 0;
}

.set-row__select {
  width: 100%;
  min-width: 7rem;
  max-width: 12rem;
  min-height: 2.25rem;
  padding: 0 var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  background-color: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.set-row__select:focus-visible {
  border-color: var(--color-focus);
}

.set-row__note {
  display: block;
}

.set-row__textarea {
  width: 100%;
  padding: var(--space-2);
  font-size: var(--font-size-sm);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  resize: vertical;
}

.set-row__textarea:focus-visible {
  border-color: var(--color-focus);
}
</style>

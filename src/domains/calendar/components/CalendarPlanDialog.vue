<script setup lang="ts">
import { ref, useId, useTemplateRef, watch } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import TextField from '@/components/ui/TextField.vue'
import type { DateKey } from '@/services/dates'

/**
 * Planifier une séance, ou déplacer un créneau existant (CDC §4.5).
 * Le même dialogue sert aux deux : en mode « déplacer », seule la date change.
 */
const props = withDefaults(
  defineProps<{
    day: DateKey
    /** Titre initial, en mode déplacement */
    title?: string
    mode?: 'create' | 'move'
  }>(),
  { title: '', mode: 'create' },
)

const emit = defineEmits<{ submit: [value: { date: DateKey; title: string }] }>()

const open = defineModel<boolean>('open', { default: false })

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const titleId = useId()
const dateId = useId()

const date = ref(props.day)
const label = ref(props.title)

watch(
  [open, dialog],
  ([isOpen, element]) => {
    if (!element) return
    if (isOpen) {
      // Chaque ouverture repart des valeurs de l'appelant
      date.value = props.day
      label.value = props.title
      if (!element.open) element.showModal()
    } else if (element.open) {
      element.close()
    }
  },
  { flush: 'post', immediate: true },
)

function cancel() {
  open.value = false
}

function submit() {
  if (!date.value) return
  emit('submit', { date: date.value, title: label.value.trim() || 'Séance' })
  open.value = false
}
</script>

<template>
  <dialog ref="dialog" class="plan" :aria-labelledby="titleId" @cancel.prevent="cancel">
    <form v-if="open" class="plan__panel" @submit.prevent="submit">
      <h2 :id="titleId" class="plan__title">
        {{ mode === 'move' ? 'Déplacer la séance' : 'Planifier une séance' }}
      </h2>

      <label :for="dateId" class="plan__field">
        <span class="plan__label">Date</span>
        <input :id="dateId" v-model="date" class="plan__date" type="date" required />
      </label>

      <TextField
        v-if="mode === 'create'"
        v-model="label"
        label="Nom de la séance"
        placeholder="Push, Jambes…"
        hint="Facultatif : « Séance » par défaut."
      />

      <div class="plan__actions">
        <BaseButton variant="ghost" @click="cancel">Annuler</BaseButton>
        <BaseButton type="submit">{{ mode === 'move' ? 'Déplacer' : 'Planifier' }}</BaseButton>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.plan {
  width: min(26rem, calc(100% - 2 * var(--space-3)));
  padding: 0;
  color: var(--color-text);
  background-color: var(--color-surface-raised);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-overlay);
}

.plan::backdrop {
  background-color: var(--color-backdrop);
}

.plan__panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
}

.plan__title {
  font-size: var(--font-size-lg);
}

.plan__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.plan__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.plan__date {
  width: 100%;
  min-height: var(--touch-target);
  padding: 0 var(--space-3);
  background-color: var(--color-bg-sunken);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
}

.plan__date:focus-visible {
  border-color: var(--color-focus);
}

.plan__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>

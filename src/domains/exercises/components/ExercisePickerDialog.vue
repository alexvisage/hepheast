<script setup lang="ts">
import { ref, useId, useTemplateRef, watch } from 'vue'
import { X } from '@lucide/vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import type { Exercise } from '@/types/domain'

import ExerciseSearch from './ExerciseSearch.vue'

/**
 * Sélecteur d'exercice en surcouche, réutilisable par la séance active et
 * la construction de programme (CDC §4.2, §6.1).
 *
 * Le dialogue reste ouvert après un ajout : en salle, on enchaîne plusieurs
 * exercices sans rouvrir la recherche. La confirmation passe par une zone
 * live pour rester perceptible au lecteur d'écran.
 * S'appuie sur <dialog> natif : piège du focus, touche Échap et fond inerte inclus.
 */
withDefaults(
  defineProps<{
    title?: string
    /** Action de chaque ligne : « Ajouter à la séance », « Ajouter au programme »… */
    selectLabel?: string
  }>(),
  { title: 'Ajouter un exercice', selectLabel: 'Ajouter' },
)

const emit = defineEmits<{ select: [exercise: Exercise] }>()

const open = defineModel<boolean>('open', { default: false })

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const titleId = useId()
const feedback = ref('')

watch(
  [open, dialog],
  ([isOpen, element]) => {
    if (!element) return
    if (isOpen && !element.open) element.showModal()
    if (!isOpen && element.open) element.close()
  },
  // Après mise à jour du DOM : le panneau doit exister pour que
  // showModal() place le focus sur le champ de recherche (autofocus).
  { flush: 'post', immediate: true },
)

function close() {
  open.value = false
  feedback.value = ''
}

function choose(exercise: Exercise) {
  feedback.value = `${exercise.name} ajouté`
  emit('select', exercise)
}
</script>

<template>
  <dialog
    ref="dialog"
    class="picker"
    :aria-labelledby="titleId"
    @cancel.prevent="close"
    @click.self="close"
  >
    <div v-if="open" class="picker__panel">
      <header class="picker__header">
        <h2 :id="titleId" class="picker__title">{{ title }}</h2>
        <IconButton label="Fermer" @click="close">
          <X :size="20" aria-hidden="true" />
        </IconButton>
      </header>

      <div class="picker__body">
        <ExerciseSearch mode="select" autofocus :select-label="selectLabel" @select="choose" />
      </div>

      <footer class="picker__footer">
        <p class="picker__feedback" aria-live="polite">{{ feedback }}</p>
        <BaseButton variant="secondary" block @click="close">Terminé</BaseButton>
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.picker {
  width: min(34rem, calc(100% - 2 * var(--space-3)));
  max-height: min(85dvh, 44rem);
  padding: 0;
  color: var(--color-text);
  background-color: var(--color-surface-raised);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-overlay);
}

.picker::backdrop {
  background-color: var(--color-backdrop);
}

.picker__panel {
  display: flex;
  flex-direction: column;
  max-height: inherit;
}

.picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-3) var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.picker__title {
  font-size: var(--font-size-lg);
}

.picker__body {
  flex: 1;
  min-height: 0;
  padding: var(--space-4) var(--space-5);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.picker__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5) var(--space-4);
  border-top: 1px solid var(--color-border);
}

.picker__feedback {
  min-height: 1.5em;
  font-size: var(--font-size-sm);
  color: var(--color-success);
  text-align: center;
}
</style>

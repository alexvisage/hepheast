<script setup lang="ts">
import { computed, ref } from 'vue'

import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { useToastStore } from '@/stores/toasts'
import type { WorkoutExercise } from '@/types/domain'

import { useActiveSessionStore } from '../activeSessionStore'

import SessionExerciseCard from './SessionExerciseCard.vue'

/**
 * Liste ordonnée des exercices de la séance en cours (CDC §4.2).
 *
 * Le réordonnancement passe par deux boutons monter/descendre : utilisables
 * au clavier et au doigt, mains moites comprises. Le glisser-déposer viendra
 * en complément, jamais en remplacement.
 * Un exercice contenant des séries validées n'est retiré qu'après
 * confirmation : rien ne disparaît silencieusement (AC-12).
 */
const active = useActiveSessionStore()
const toasts = useToastStore()

const entries = computed(() => active.session?.exercises ?? [])

const confirming = ref(false)
const pending = ref<WorkoutExercise | null>(null)
const announcement = ref('')

/** « Développé couché compte 2 séries validées. Elles seront perdues. » */
const removalWarning = computed(() => {
  if (!pending.value) return ''
  const count = pending.value.sets.filter((set) => set.status === 'done').length
  const s = count > 1 ? 's' : ''
  const verb = count > 1 ? 'seront' : 'sera'
  return `${nameOf(pending.value)} compte ${count} série${s} validée${s}. Elle${s} ${verb} perdue${s}.`
})

function nameOf(entry: WorkoutExercise): string {
  return active.exercises[entry.exerciseId]?.name ?? 'Exercice'
}

function indexOf(entry: WorkoutExercise): number {
  return entries.value.findIndex((item) => item.id === entry.id)
}

function move(entry: WorkoutExercise, direction: -1 | 1) {
  const before = indexOf(entry)
  active.moveExercise(entry.id, direction)
  const after = indexOf(entry)
  if (after === before) return
  // Le déplacement n'est visible que des yeux : il est aussi annoncé
  announcement.value = `${nameOf(entry)} déplacé en position ${after + 1} sur ${entries.value.length}`
}

function requestRemoval(entry: WorkoutExercise) {
  if (entry.sets.some((set) => set.status === 'done')) {
    pending.value = entry
    confirming.value = true
    return
  }
  remove(entry)
}

function remove(entry: WorkoutExercise) {
  const name = nameOf(entry)
  active.removeExercise(entry.id)
  announcement.value = `${name} retiré de la séance`
  toasts.show(`${name} retiré de la séance`)
}

function confirmRemoval() {
  const entry = pending.value
  pending.value = null
  if (entry) remove(entry)
}
</script>

<template>
  <div class="session-exercises">
    <p class="visually-hidden" role="status">{{ announcement }}</p>

    <ul class="session-exercises__list" role="list">
      <li v-for="(entry, index) in entries" :key="entry.id">
        <SessionExerciseCard
          :entry="entry"
          :exercise="active.exercises[entry.exerciseId]"
          :last-performance="active.lastPerformances[entry.exerciseId]"
          :position="index + 1"
          :total="entries.length"
          @move="move(entry, $event)"
          @remove="requestRemoval(entry)"
        />
      </li>
    </ul>

    <ConfirmDialog
      v-model:open="confirming"
      title="Retirer cet exercice ?"
      confirm-label="Retirer"
      danger
      @confirm="confirmRemoval"
      @cancel="pending = null"
    >
      {{ removalWarning }}
    </ConfirmDialog>
  </div>
</template>

<style scoped>
.session-exercises__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
</style>

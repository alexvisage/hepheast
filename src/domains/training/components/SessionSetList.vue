<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus } from '@lucide/vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { formatSet } from '@/services/format'
import type { SetEntry, WorkoutExercise } from '@/types/domain'

import { useActiveSessionStore } from '../activeSessionStore'

import SetRow from './SetRow.vue'

/**
 * Séries d'un exercice de la séance en cours : saisie, statut et ajout.
 * Fait le lien entre les lignes de saisie (présentation) et le store.
 * Une série validée ne disparaît qu'après confirmation (AC-12).
 */
const props = defineProps<{ entry: WorkoutExercise }>()

const active = useActiveSessionStore()

const confirming = ref(false)
const pending = ref<SetEntry | null>(null)

const removalWarning = computed(() => {
  if (!pending.value) return ''
  const { reps, load, unit } = pending.value
  return `La série validée (${formatSet(reps, load, unit)}) sera supprimée de la séance.`
})

function update(set: SetEntry, patch: Partial<SetEntry>) {
  active.updateSet(props.entry.id, set.id, patch)
}

function toggleSkipped(set: SetEntry) {
  update(set, {
    status: set.status === 'skipped' ? 'planned' : 'skipped',
    completedAt: undefined,
  })
}

function requestRemoval(set: SetEntry) {
  if (set.status === 'done') {
    pending.value = set
    confirming.value = true
    return
  }
  active.removeSet(props.entry.id, set.id)
}

function confirmRemoval() {
  const set = pending.value
  pending.value = null
  if (set) active.removeSet(props.entry.id, set.id)
}
</script>

<template>
  <div class="set-list">
    <ul class="set-list__items" role="list">
      <li v-for="(set, index) in entry.sets" :key="set.id">
        <SetRow
          :set="set"
          :index="index + 1"
          @update="update(set, $event)"
          @toggle-done="active.toggleSetDone(entry.id, set.id)"
          @toggle-skipped="toggleSkipped(set)"
          @remove="requestRemoval(set)"
        />
      </li>
    </ul>

    <BaseButton variant="ghost" block @click="active.addSet(entry.id)">
      <template #icon><Plus :size="18" aria-hidden="true" /></template>
      Ajouter une série
    </BaseButton>

    <ConfirmDialog
      v-model:open="confirming"
      title="Supprimer cette série ?"
      confirm-label="Supprimer"
      danger
      @confirm="confirmRemoval"
      @cancel="pending = null"
    >
      {{ removalWarning }}
    </ConfirmDialog>
  </div>
</template>

<style scoped>
.set-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.set-list__items {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>

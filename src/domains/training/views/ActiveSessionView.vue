<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/ui/BaseButton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import StateView from '@/components/ui/StateView.vue'
import SyncStatus from '@/components/ui/SyncStatus.vue'
import ExercisePickerDialog from '@/domains/exercises/components/ExercisePickerDialog.vue'
import { formatClock } from '@/services/format'
import { useToastStore } from '@/stores/toasts'
import type { Exercise } from '@/types/domain'

import { useActiveSessionStore } from '../activeSessionStore'
import RestTimer from '../components/RestTimer.vue'
import SessionExerciseList from '../components/SessionExerciseList.vue'

/**
 * Écran de séance active : en-tête, chronomètre, état de sauvegarde,
 * exercices (ajout, ordre, retrait), fin ou abandon.
 * La saisie des séries arrive avec SCRUM-139.
 */
const active = useActiveSessionStore()
const toasts = useToastStore()
const router = useRouter()

const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | undefined
const confirmAbandon = ref(false)
const picking = ref(false)
const finishing = ref(false)

const elapsed = computed(() =>
  active.session ? (now.value - Date.parse(active.session.startedAt)) / 1000 : 0,
)

onMounted(() => {
  if (!active.loaded) void active.load()
  clock = setInterval(() => (now.value = Date.now()), 1000)
})

onBeforeUnmount(() => {
  clearInterval(clock)
  void active.flush()
})

async function addExercise(exercise: Exercise) {
  try {
    await active.addExercise(exercise)
  } catch {
    toasts.show(`« ${exercise.name} » n’a pas pu être ajouté. Réessaie.`, 'danger')
  }
}

async function finish() {
  finishing.value = true
  const completed = await active.finish()
  finishing.value = false
  if (!completed) {
    toasts.show('La séance n’a pas pu être enregistrée. Ta saisie est conservée.', 'danger')
    return
  }
  toasts.show('Séance enregistrée', 'success')
  await router.push({ name: 'training' })
}

async function abandon() {
  await active.abandon()
  toasts.show('Séance abandonnée')
  await router.push({ name: 'training' })
}
</script>

<template>
  <div class="session">
    <StateView v-if="!active.loaded" kind="loading" />

    <StateView
      v-else-if="!active.session"
      kind="empty"
      title="Aucune séance en cours"
      description="Démarre une séance pour commencer à saisir tes séries."
    >
      <BaseButton :to="{ name: 'training' }">Démarrer une séance</BaseButton>
    </StateView>

    <template v-else>
      <header class="session__header">
        <div class="session__heading">
          <h1 class="session__title">{{ active.session.title }}</h1>
          <SyncStatus :state="active.sync" />
        </div>
        <p class="session__clock figure" aria-label="Durée de la séance">
          <span class="visually-hidden">Durée :</span>{{ formatClock(elapsed) }}
        </p>
      </header>

      <StateView
        v-if="active.session.exercises.length === 0"
        kind="empty"
        title="Ajoute ton premier exercice"
        description="Cherche dans le catalogue ou filtre sur tes favoris."
      >
        <BaseButton @click="picking = true">Ajouter un exercice</BaseButton>
      </StateView>

      <template v-else>
        <SessionExerciseList />
        <BaseButton variant="secondary" block @click="picking = true">
          Ajouter un exercice
        </BaseButton>
      </template>

      <RestTimer />

      <footer class="session__footer">
        <BaseButton size="lg" block :loading="finishing" @click="finish">
          Terminer la séance
        </BaseButton>
        <BaseButton variant="ghost" block @click="confirmAbandon = true">
          Abandonner la séance
        </BaseButton>
      </footer>

      <ExercisePickerDialog
        v-model:open="picking"
        select-label="Ajouter à la séance"
        @select="addExercise"
      />

      <ConfirmDialog
        v-model:open="confirmAbandon"
        title="Abandonner la séance ?"
        confirm-label="Abandonner"
        danger
        @confirm="abandon"
      >
        La séance sera marquée comme abandonnée et n’apparaîtra pas dans ta progression.
      </ConfirmDialog>
    </template>
  </div>
</template>

<style scoped>
.session {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 40rem;
}

.session__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}

.session__heading {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  min-width: 0;
}

.session__title {
  font-size: var(--font-size-xl);
}

.session__clock {
  font-size: var(--font-size-3xl);
  color: var(--color-accent-text);
}

.session__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>

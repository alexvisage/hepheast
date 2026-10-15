<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowDown, ArrowUp, ChevronLeft, Plus, Trash2 } from '@lucide/vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import IconButton from '@/components/ui/IconButton.vue'
import StateView from '@/components/ui/StateView.vue'
import ExercisePickerDialog from '@/domains/exercises/components/ExercisePickerDialog.vue'
import { services, ServiceError } from '@/services'
import { createId } from '@/services/local/storage'
import { useToastStore } from '@/stores/toasts'
import type { Exercise, Id, Program, ProgramDay, ProgramExercise } from '@/types/domain'

import ProgramExerciseRow from '../components/ProgramExerciseRow.vue'

/**
 * Éditeur de programme (CDC §6.1) : jours, exercices et prescriptions.
 *
 * On travaille sur un brouillon local et l'enregistrement est explicite :
 * modifier un programme déjà utilisé crée une nouvelle version, l'écran le
 * dit avant d'enregistrer plutôt qu'après (AC de SCRUM-114).
 * Réordonnancement par boutons : utilisable au clavier et au doigt ; le
 * glisser-déposer viendra en complément, comme ailleurs dans l'application.
 */
const props = defineProps<{ id: string }>()

const toasts = useToastStore()

const program = ref<Program | null>(null)
const days = ref<ProgramDay[]>([])
const names = ref<Record<Id, string>>({})
const status = ref<'loading' | 'ready' | 'not-found' | 'error'>('loading')
const saving = ref(false)
const pickerDay = ref<Id | null>(null)
const removingDay = ref<ProgramDay | null>(null)
const confirmingDay = ref(false)

const current = computed(() =>
  program.value?.versions.find((version) => version.version === program.value?.currentVersion),
)

/** Une version déjà utilisée ne se modifie plus : enregistrer en créera une autre */
const willCreateVersion = computed(() => current.value?.usedAt !== undefined)

const dirty = computed(
  () => JSON.stringify(days.value) !== JSON.stringify(current.value?.days ?? []),
)

async function load(id: string) {
  status.value = 'loading'
  try {
    const found = await services.programs.getProgram(id)
    program.value = found
    days.value = structuredClone(
      found.versions.find((version) => version.version === found.currentVersion)?.days ?? [],
    )
    await loadNames()
    status.value = 'ready'
  } catch (error) {
    status.value =
      error instanceof ServiceError && error.code === 'not-found' ? 'not-found' : 'error'
  }
}

/** Noms des exercices prescrits, pour l'affichage */
async function loadNames() {
  const ids = [
    ...new Set(days.value.flatMap((day) => day.exercises.map((item) => item.exerciseId))),
  ].filter((id) => !(id in names.value))
  if (ids.length === 0) return
  const found = await Promise.all(ids.map((id) => services.exercises.getExercise(id)))
  names.value = { ...names.value, ...Object.fromEntries(found.map((item) => [item.id, item.name])) }
}

function nameOf(exerciseId: Id): string {
  return names.value[exerciseId] ?? 'Exercice'
}

// --- Jours ---------------------------------------------------------------

function addDay() {
  days.value = [
    ...days.value,
    { id: createId(), name: `Jour ${days.value.length + 1}`, exercises: [] },
  ]
}

function renameDay(day: ProgramDay, name: string) {
  day.name = name
}

function moveDay(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= days.value.length) return
  const next = [...days.value]
  const [moved] = next.splice(index, 1)
  if (moved) next.splice(target, 0, moved)
  days.value = next
}

function requestRemoveDay(day: ProgramDay) {
  if (day.exercises.length === 0) {
    days.value = days.value.filter((item) => item.id !== day.id)
    return
  }
  removingDay.value = day
  confirmingDay.value = true
}

function confirmRemoveDay() {
  const day = removingDay.value
  removingDay.value = null
  if (day) days.value = days.value.filter((item) => item.id !== day.id)
}

// --- Exercices -----------------------------------------------------------

async function addExercise(exercise: Exercise) {
  const day = days.value.find((item) => item.id === pickerDay.value)
  if (!day) return
  day.exercises.push({
    id: createId(),
    exerciseId: exercise.id,
    sets: 3,
    reps: 10,
    restSeconds: 120,
  })
  names.value = { ...names.value, [exercise.id]: exercise.name }
}

/** Les valeurs vidées passent à `undefined` et disparaissent à l'enregistrement */
function updateExercise(exercise: ProgramExercise, patch: Partial<ProgramExercise>) {
  Object.assign(exercise, patch)
}

function moveExercise(day: ProgramDay, index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= day.exercises.length) return
  const [moved] = day.exercises.splice(index, 1)
  if (moved) day.exercises.splice(target, 0, moved)
}

function removeExercise(day: ProgramDay, exercise: ProgramExercise) {
  day.exercises = day.exercises.filter((item) => item.id !== exercise.id)
}

// --- Enregistrement ------------------------------------------------------

async function save() {
  if (!program.value) return
  saving.value = true
  try {
    const updated = await services.programs.saveDays(program.value.id, days.value)
    const createdVersion = updated.currentVersion !== program.value.currentVersion
    program.value = updated
    days.value = structuredClone(
      updated.versions.find((version) => version.version === updated.currentVersion)?.days ?? [],
    )
    toasts.show(
      createdVersion
        ? `Programme enregistré en version ${updated.currentVersion}`
        : 'Programme enregistré',
      'success',
    )
  } catch {
    toasts.show('Le programme n’a pas pu être enregistré. Réessaie.', 'danger')
  } finally {
    saving.value = false
  }
}

watch(() => props.id, load, { immediate: true })
</script>

<template>
  <div class="editor">
    <RouterLink :to="{ name: 'programs' }" class="editor__back">
      <ChevronLeft :size="18" aria-hidden="true" />
      Programmes
    </RouterLink>

    <StateView v-if="status === 'loading'" kind="loading" />

    <StateView
      v-else-if="status === 'not-found'"
      kind="empty"
      title="Ce programme n’existe pas"
      description="Il a peut-être été supprimé."
    >
      <BaseButton :to="{ name: 'programs' }" variant="secondary">Voir mes programmes</BaseButton>
    </StateView>

    <StateView
      v-else-if="status === 'error'"
      kind="error"
      description="Le programme n’a pas pu être chargé."
    >
      <BaseButton variant="secondary" @click="load(id)">Réessayer</BaseButton>
    </StateView>

    <template v-else-if="program">
      <header class="editor__header">
        <div>
          <h1>{{ program.title }}</h1>
          <p class="text-muted">
            Version {{ program.currentVersion }}
            <template v-if="program.description"> · {{ program.description }}</template>
          </p>
        </div>
        <div class="editor__save">
          <p v-if="dirty" class="editor__dirty" role="status">Modifications non enregistrées</p>
          <BaseButton :disabled="!dirty" :loading="saving" @click="save">Enregistrer</BaseButton>
        </div>
      </header>

      <p v-if="willCreateVersion" class="editor__notice">
        Ce programme a déjà servi à une séance. Enregistrer créera la version
        {{ program.currentVersion + 1 }} : les séances passées garderont la version
        {{ program.currentVersion }}.
      </p>

      <StateView
        v-if="days.length === 0"
        kind="empty"
        title="Aucun jour dans ce programme"
        description="Ajoute un premier jour, puis ses exercices."
      >
        <BaseButton @click="addDay">Ajouter un jour</BaseButton>
      </StateView>

      <template v-else>
        <BaseCard v-for="(day, dayIndex) in days" :key="day.id" tag="article" class="editor__day">
          <template #actions>
            <IconButton
              :label="`Monter ${day.name}`"
              :disabled="dayIndex === 0"
              @click="moveDay(dayIndex, -1)"
            >
              <ArrowUp :size="20" aria-hidden="true" />
            </IconButton>
            <IconButton
              :label="`Descendre ${day.name}`"
              :disabled="dayIndex === days.length - 1"
              @click="moveDay(dayIndex, 1)"
            >
              <ArrowDown :size="20" aria-hidden="true" />
            </IconButton>
            <IconButton :label="`Supprimer ${day.name}`" @click="requestRemoveDay(day)">
              <Trash2 :size="20" aria-hidden="true" />
            </IconButton>
          </template>

          <label class="editor__day-name">
            <span class="visually-hidden">Nom du jour {{ dayIndex + 1 }}</span>
            <input
              class="editor__day-input"
              type="text"
              :value="day.name"
              @input="renameDay(day, ($event.target as HTMLInputElement).value)"
            />
          </label>

          <p v-if="day.exercises.length === 0" class="text-muted">Aucun exercice dans ce jour.</p>

          <ul v-else class="editor__exercises" role="list">
            <li v-for="(exercise, index) in day.exercises" :key="exercise.id">
              <ProgramExerciseRow
                :exercise="exercise"
                :name="nameOf(exercise.exerciseId)"
                :position="index + 1"
                :total="day.exercises.length"
                @update="updateExercise(exercise, $event)"
                @move="moveExercise(day, index, $event)"
                @remove="removeExercise(day, exercise)"
              />
            </li>
          </ul>

          <BaseButton variant="ghost" block @click="pickerDay = day.id">
            <template #icon><Plus :size="18" aria-hidden="true" /></template>
            Ajouter un exercice
          </BaseButton>
        </BaseCard>

        <BaseButton variant="secondary" block @click="addDay">Ajouter un jour</BaseButton>
      </template>

      <ExercisePickerDialog
        :open="pickerDay !== null"
        select-label="Ajouter au jour"
        @select="addExercise"
        @update:open="pickerDay = $event ? pickerDay : null"
      />

      <ConfirmDialog
        v-model:open="confirmingDay"
        title="Supprimer ce jour ?"
        confirm-label="Supprimer"
        danger
        @confirm="confirmRemoveDay"
        @cancel="removingDay = null"
      >
        {{ removingDay?.name }} contient {{ removingDay?.exercises.length }} exercice{{
          (removingDay?.exercises.length ?? 0) > 1 ? 's' : ''
        }}. Ils seront perdus.
      </ConfirmDialog>
    </template>
  </div>
</template>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 48rem;
}

.editor__back {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-decoration: none;
}

.editor__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.editor__save {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
}

.editor__dirty {
  font-size: var(--font-size-xs);
  color: var(--color-warning);
}

.editor__notice {
  padding: var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-warning);
  background-color: var(--color-warning-soft);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
}

.editor__day-input {
  width: 100%;
  min-height: var(--touch-target);
  padding: 0 var(--space-3);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  background-color: var(--color-bg-sunken);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
}

.editor__day-input:focus-visible {
  border-color: var(--color-focus);
}

.editor__exercises {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>

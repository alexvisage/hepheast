<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight, Plus, Search, Star } from '@lucide/vue'

import StateView from '@/components/ui/StateView.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { services, type ExerciseFilters } from '@/services'
import type { Exercise } from '@/types/domain'

import { useCatalogStore } from '../catalogStore'

import FavoriteToggle from './FavoriteToggle.vue'

/**
 * Recherche et filtres du catalogue, partagés entre la page Exercices
 * (mode « link ») et le sélecteur de la séance (mode « select »).
 */
withDefaults(
  defineProps<{
    mode?: 'link' | 'select'
    /** Action de chaque ligne en mode « select » : « Ajouter à la séance », « …au programme » */
    selectLabel?: string
    /** Place le curseur dans la recherche dès l'affichage (sélecteur en surcouche) */
    autofocus?: boolean
  }>(),
  { mode: 'link', selectLabel: 'Ajouter' },
)

const emit = defineEmits<{ select: [exercise: Exercise] }>()

const catalog = useCatalogStore()

const query = ref('')
const muscleId = ref('')
const equipmentId = ref('')
const favoritesOnly = ref(false)

const results = ref<Exercise[]>([])
const status = ref<'loading' | 'ready' | 'error'>('loading')

let debounce: ReturnType<typeof setTimeout> | undefined
let requestId = 0

async function search() {
  const current = ++requestId
  status.value = 'loading'
  const filters: ExerciseFilters = {
    query: query.value || undefined,
    muscleId: muscleId.value || undefined,
    equipmentId: equipmentId.value || undefined,
    favoritesOnly: favoritesOnly.value || undefined,
  }
  try {
    const found = await services.exercises.listExercises(filters)
    if (current !== requestId) return
    results.value = found
    status.value = 'ready'
  } catch {
    if (current === requestId) status.value = 'error'
  }
}

function resetFilters() {
  query.value = ''
  muscleId.value = ''
  equipmentId.value = ''
  favoritesOnly.value = false
}

watch(query, () => {
  clearTimeout(debounce)
  debounce = setTimeout(search, 200)
})
watch([muscleId, equipmentId, favoritesOnly], search)

onMounted(async () => {
  await catalog.load()
  await search()
})
</script>

<template>
  <div class="exercise-search">
    <div class="exercise-search__filters" role="search">
      <label class="search-input">
        <span class="visually-hidden">Rechercher un exercice</span>
        <Search class="search-input__icon" :size="18" aria-hidden="true" />
        <input
          v-model="query"
          class="search-input__field"
          type="search"
          placeholder="Rechercher : squat, tirage, RDL…"
          autocomplete="off"
          :autofocus="autofocus"
        />
      </label>
      <div class="exercise-search__selects">
        <label class="select">
          <span class="visually-hidden">Groupe musculaire</span>
          <select v-model="muscleId" class="select__field">
            <option value="">Tous les muscles</option>
            <option v-for="muscle in catalog.muscles" :key="muscle.id" :value="muscle.id">
              {{ muscle.name }}
            </option>
          </select>
        </label>
        <label class="select">
          <span class="visually-hidden">Équipement</span>
          <select v-model="equipmentId" class="select__field">
            <option value="">Tout l’équipement</option>
            <option v-for="item in catalog.equipment" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </label>
      </div>
      <button
        type="button"
        class="chip"
        :class="{ 'chip--active': favoritesOnly }"
        :aria-pressed="favoritesOnly"
        @click="favoritesOnly = !favoritesOnly"
      >
        <Star :size="16" :fill="favoritesOnly ? 'currentColor' : 'none'" aria-hidden="true" />
        Favoris uniquement
      </button>
    </div>

    <p class="exercise-search__count text-muted" aria-live="polite">
      <template v-if="status === 'ready'">
        {{ results.length }} exercice{{ results.length > 1 ? 's' : '' }}
      </template>
    </p>

    <StateView v-if="status === 'loading' && results.length === 0" kind="loading" />
    <StateView
      v-else-if="status === 'error'"
      kind="error"
      description="Vérifiez votre connexion puis réessayez."
    >
      <BaseButton variant="secondary" @click="search">Réessayer</BaseButton>
    </StateView>
    <StateView
      v-else-if="status === 'ready' && results.length === 0"
      kind="empty"
      title="Aucun exercice ne correspond"
      description="Essayez un autre mot ou retirez un filtre."
    >
      <BaseButton variant="secondary" @click="resetFilters">Effacer les filtres</BaseButton>
    </StateView>

    <ul v-else class="exercise-list" role="list" :aria-busy="status === 'loading'">
      <li v-for="exercise in results" :key="exercise.id" class="exercise-list__item">
        <RouterLink
          v-if="mode === 'link'"
          :to="{ name: 'exercise-detail', params: { id: exercise.id } }"
          class="exercise-row"
        >
          <span class="exercise-row__text">
            <span class="exercise-row__name">{{ exercise.name }}</span>
            <span class="exercise-row__meta">{{ catalog.summary(exercise) }}</span>
          </span>
          <ChevronRight class="exercise-row__icon" :size="20" aria-hidden="true" />
        </RouterLink>
        <button v-else type="button" class="exercise-row" @click="emit('select', exercise)">
          <span class="exercise-row__text">
            <span class="exercise-row__name">{{ exercise.name }}</span>
            <span class="exercise-row__meta">{{ catalog.summary(exercise) }}</span>
          </span>
          <Plus class="exercise-row__icon" :size="20" aria-hidden="true" />
          <span class="visually-hidden">{{ selectLabel }}</span>
        </button>
        <FavoriteToggle :exercise="exercise" class="exercise-list__favorite" />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.exercise-search {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.exercise-search__filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.exercise-search__selects {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

.search-input {
  position: relative;
  display: block;
}

.search-input__icon {
  position: absolute;
  top: 50%;
  left: var(--space-3);
  color: var(--color-text-subtle);
  transform: translateY(-50%);
}

.search-input__field,
.select__field {
  width: 100%;
  min-height: var(--touch-target);
  background-color: var(--color-bg-sunken);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
}

.search-input__field {
  padding: 0 var(--space-4) 0 2.5rem;
}

.select__field {
  padding: 0 var(--space-3);
}

.search-input__field:focus-visible,
.select__field:focus-visible {
  border-color: var(--color-focus);
}

.exercise-search__count {
  min-height: 1.5em;
  font-size: var(--font-size-sm);
}

.exercise-list {
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.exercise-list[aria-busy='true'] {
  opacity: 0.6;
}

.exercise-list__item {
  display: flex;
  align-items: center;
}

.exercise-list__item + .exercise-list__item {
  border-top: 1px solid var(--color-border);
}

.exercise-list__favorite {
  margin-right: var(--space-2);
}

.chip {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--space-2);
  min-height: 2.5rem;
  padding: 0 var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  background-color: transparent;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
}

.chip--active {
  color: var(--color-warning);
  background-color: var(--color-warning-soft);
  border-color: var(--color-warning);
}

.exercise-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  min-width: 0;
  min-height: 4rem;
  padding: var(--space-3) var(--space-4);
  color: inherit;
  text-align: left;
  text-decoration: none;
  background: transparent;
  border: 0;
}

.exercise-row:hover {
  background-color: var(--color-surface-raised);
}

.exercise-row:focus-visible {
  box-shadow: inset 0 0 0 2px var(--color-focus);
}

.exercise-row__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.exercise-row__name {
  font-weight: var(--font-weight-semibold);
}

.exercise-row__meta {
  overflow: hidden;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.exercise-row__icon {
  flex-shrink: 0;
  color: var(--color-text-subtle);
}
</style>

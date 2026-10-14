import { defineStore } from 'pinia'
import { ref } from 'vue'

import { services } from '@/services'
import type { Equipment, Exercise, Id, MuscleGroup } from '@/types/domain'

/** Référentiels du catalogue (muscles, équipements), chargés une fois et mis en cache */
export const useCatalogStore = defineStore('catalog', () => {
  const muscles = ref<MuscleGroup[]>([])
  const equipment = ref<Equipment[]>([])
  const favoriteIds = ref<Set<Id>>(new Set())
  let loading: Promise<void> | null = null

  function load(): Promise<void> {
    loading ??= Promise.all([
      services.exercises.listMuscleGroups(),
      services.exercises.listEquipment(),
      services.exercises.listFavoriteIds(),
    ]).then(([muscleList, equipmentList, favorites]) => {
      muscles.value = muscleList
      equipment.value = equipmentList
      favoriteIds.value = new Set(favorites)
    })
    return loading
  }

  function muscleName(id: Id): string {
    return muscles.value.find((muscle) => muscle.id === id)?.name ?? id
  }

  function equipmentName(id: Id): string {
    return equipment.value.find((item) => item.id === id)?.name ?? id
  }

  /** Résumé lisible : « Pectoraux, Triceps (barre) » */
  function summary(exercise: Exercise): string {
    const targets = exercise.primaryMuscleIds.map(muscleName).join(', ')
    return `${targets} (${equipmentName(exercise.equipmentId).toLowerCase()})`
  }

  function isFavorite(id: Id): boolean {
    return favoriteIds.value.has(id)
  }

  async function toggleFavorite(id: Id) {
    const next = !isFavorite(id)
    const updated = new Set(favoriteIds.value)
    if (next) updated.add(id)
    else updated.delete(id)
    favoriteIds.value = updated
    await services.exercises.setFavorite(id, next)
  }

  return {
    muscles,
    equipment,
    favoriteIds,
    load,
    muscleName,
    equipmentName,
    summary,
    isFavorite,
    toggleFavorite,
  }
})

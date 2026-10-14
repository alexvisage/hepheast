import { ServiceError, type ExerciseCatalogService } from '../contracts'

import { equipment, exercises, muscleGroups } from './seed'
import { latency, readJson, writeJson } from './storage'
import { normalize } from './text'

const FAVORITES_KEY = 'favorites'

export function createLocalExerciseCatalog(): ExerciseCatalogService {
  return {
    async listMuscleGroups() {
      await latency(40)
      return muscleGroups
    },

    async listEquipment() {
      await latency(40)
      return equipment
    },

    async listExercises(filters = {}) {
      await latency()
      const favorites = new Set(readJson<string[]>(FAVORITES_KEY, []))
      const query = normalize(filters.query ?? '')

      return exercises
        .filter((exercise) => {
          if (query) {
            const haystack = [exercise.name, ...exercise.aliases].map(normalize)
            if (!haystack.some((text) => text.includes(query))) return false
          }
          if (
            filters.muscleId &&
            !exercise.primaryMuscleIds.includes(filters.muscleId) &&
            !exercise.secondaryMuscleIds.includes(filters.muscleId)
          ) {
            return false
          }
          if (filters.equipmentId && exercise.equipmentId !== filters.equipmentId) return false
          if (filters.movement && exercise.movement !== filters.movement) return false
          if (filters.favoritesOnly && !favorites.has(exercise.id)) return false
          return true
        })
        .sort((a, b) => {
          const favoriteOrder = Number(favorites.has(b.id)) - Number(favorites.has(a.id))
          return favoriteOrder || a.name.localeCompare(b.name, 'fr')
        })
    },

    async getExercise(id) {
      await latency(60)
      const exercise = exercises.find((item) => item.id === id)
      if (!exercise) throw new ServiceError('not-found', 'Exercice introuvable')
      return exercise
    },

    async listFavoriteIds() {
      return readJson<string[]>(FAVORITES_KEY, [])
    },

    async setFavorite(id, favorite) {
      const current = new Set(readJson<string[]>(FAVORITES_KEY, []))
      if (favorite) current.add(id)
      else current.delete(id)
      writeJson(FAVORITES_KEY, [...current])
    },
  }
}

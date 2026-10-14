import type { Services } from './contracts'
import { createLocalAuth } from './local/localAuth'
import { createLocalExerciseCatalog } from './local/localExercises'
import { createLocalSchedule } from './local/localSchedule'
import { createLocalWorkouts } from './local/localWorkouts'

/**
 * Point d'entrée unique des données.
 * Adaptateur local pour l'instant ; l'adaptateur Supabase prendra sa place ici.
 */
function createServices(): Services {
  const auth = createLocalAuth()
  return {
    auth,
    exercises: createLocalExerciseCatalog(),
    workouts: createLocalWorkouts(() => auth.currentUserId()),
    schedule: createLocalSchedule(() => auth.currentUserId()),
  }
}

export const services = createServices()

export * from './contracts'

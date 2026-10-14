import { beforeEach, describe, expect, it } from 'vitest'

import type { WorkoutSession } from '@/types/domain'

import { createLocalExerciseCatalog } from '../local/localExercises'
import { createLocalWorkouts } from '../local/localWorkouts'

beforeEach(() => {
  localStorage.clear()
})

describe('catalogue local', () => {
  const catalog = createLocalExerciseCatalog()

  it('recherche sans tenir compte des accents ni de la casse', async () => {
    const results = await catalog.listExercises({ query: 'developpe' })
    expect(results.map((exercise) => exercise.id)).toContain('bench-press')
  })

  it('trouve un exercice par son alias', async () => {
    const results = await catalog.listExercises({ query: 'rdl' })
    expect(results.map((exercise) => exercise.id)).toEqual(['romanian-deadlift'])
  })

  it('filtre par muscle principal ou secondaire', async () => {
    const results = await catalog.listExercises({ muscleId: 'triceps' })
    const ids = results.map((exercise) => exercise.id)
    expect(ids).toContain('triceps-pushdown')
    expect(ids).toContain('bench-press')
    expect(ids).not.toContain('back-squat')
  })

  it('remonte les favoris en tête de liste', async () => {
    await catalog.setFavorite('plank', true)
    const results = await catalog.listExercises()
    expect(results[0]?.id).toBe('plank')
    expect(await catalog.listExercises({ favoritesOnly: true })).toHaveLength(1)
  })
})

describe('séances locales', () => {
  const workouts = createLocalWorkouts(() => 'user-1')

  function completed(session: WorkoutSession): WorkoutSession {
    return {
      ...session,
      status: 'completed',
      endedAt: new Date().toISOString(),
      exercises: [
        {
          id: 'we-1',
          exerciseId: 'bench-press',
          sets: [
            { id: 's1', kind: 'working', status: 'done', reps: 8, load: 80, unit: 'kg' },
            { id: 's2', kind: 'working', status: 'skipped', reps: null, load: null, unit: 'kg' },
          ],
        },
      ],
    }
  }

  it('ne démarre pas deux séances actives à la fois', async () => {
    const first = await workouts.startSession({ title: 'Séance libre' })
    const second = await workouts.startSession({ title: 'Autre' })
    expect(second.id).toBe(first.id)
  })

  it('enregistre une séance de façon idempotente', async () => {
    const session = await workouts.startSession({ title: 'Push' })
    await workouts.saveSession(completed(session))
    await workouts.saveSession(completed(session))
    expect(await workouts.listCompletedSessions()).toHaveLength(1)
    expect(await workouts.getActiveSession()).toBeNull()
  })

  it('retourne la dernière performance réalisée d’un exercice', async () => {
    const session = await workouts.startSession({ title: 'Push' })
    await workouts.saveSession(completed(session))
    const last = await workouts.getLastPerformance('bench-press')
    expect(last?.sets).toEqual([{ reps: 8, load: 80, unit: 'kg', kind: 'working' }])
  })
})

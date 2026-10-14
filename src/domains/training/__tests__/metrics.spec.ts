import { describe, expect, it } from 'vitest'

import type { SetEntry, WorkoutSession } from '@/types/domain'

import { countsTowardVolume, setVolumeKg, summarizeSession } from '../metrics'

function set(overrides: Partial<SetEntry>): SetEntry {
  return {
    id: crypto.randomUUID(),
    kind: 'working',
    status: 'done',
    reps: 10,
    load: 50,
    unit: 'kg',
    ...overrides,
  }
}

describe('volume', () => {
  it('multiplie charge et répétitions pour une série de travail réalisée', () => {
    expect(setVolumeKg(set({ reps: 8, load: 100 }))).toBe(800)
  })

  it('exclut échauffements, séries non réalisées et charges absentes', () => {
    expect(countsTowardVolume(set({ kind: 'warmup' }))).toBe(false)
    expect(countsTowardVolume(set({ status: 'planned' }))).toBe(false)
    expect(countsTowardVolume(set({ status: 'skipped' }))).toBe(false)
    expect(countsTowardVolume(set({ load: null }))).toBe(false)
    expect(countsTowardVolume(set({ reps: 0 }))).toBe(false)
  })

  it('compte les séries dégressives', () => {
    expect(setVolumeKg(set({ kind: 'drop', reps: 12, load: 40 }))).toBe(480)
  })

  it('convertit les livres en kilogrammes', () => {
    expect(setVolumeKg(set({ reps: 1, load: 100, unit: 'lb' }))).toBeCloseTo(45.359, 3)
  })
})

describe('summarizeSession', () => {
  const session: WorkoutSession = {
    id: 's',
    userId: 'u',
    title: 'Push',
    status: 'completed',
    startedAt: '2026-10-14T08:00:00.000Z',
    endedAt: '2026-10-14T09:05:00.000Z',
    exercises: [
      {
        id: 'a',
        exerciseId: 'bench-press',
        sets: [
          set({ kind: 'warmup', reps: 10, load: 40 }),
          set({ reps: 8, load: 80 }),
          set({ reps: 8, load: 80 }),
        ],
      },
      { id: 'b', exerciseId: 'dips', sets: [set({ reps: 12, load: null })] },
      { id: 'c', exerciseId: 'cable-fly', sets: [set({ status: 'planned' })] },
    ],
  }

  it('résume exercices, séries, répétitions, volume et durée', () => {
    expect(summarizeSession(session)).toEqual({
      exerciseCount: 2,
      completedSets: 4,
      totalReps: 38,
      volumeKg: 1280,
      durationSeconds: 3900,
    })
  })
})

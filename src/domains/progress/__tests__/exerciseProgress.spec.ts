import { describe, expect, it } from 'vitest'

import type { SetEntry, WorkoutSession } from '@/types/domain'

import {
  buildExerciseProgress,
  estimateOneRepMax,
  metricValue,
  type ExercisePoint,
} from '../exerciseProgress'

function set(overrides: Partial<SetEntry> = {}): SetEntry {
  return {
    id: crypto.randomUUID(),
    kind: 'working',
    status: 'done',
    reps: 8,
    load: 80,
    unit: 'kg',
    ...overrides,
  }
}

function session(
  startedAt: string,
  sets: SetEntry[],
  exerciseId = 'bench-press',
  status: WorkoutSession['status'] = 'completed',
): WorkoutSession {
  return {
    id: crypto.randomUUID(),
    userId: 'u1',
    title: 'Push',
    status,
    startedAt,
    endedAt: startedAt,
    exercises: [{ id: crypto.randomUUID(), exerciseId, sets }],
  }
}

const PARIS = { timeZone: 'Europe/Paris' }

describe('1RM estimé', () => {
  it('applique la formule d’Epley', () => {
    // 100 × (1 + 8/30) = 126,7
    expect(estimateOneRepMax(100, 8)).toBe(126.7)
    expect(estimateOneRepMax(80, 5)).toBe(93.3)
  })

  it('rend la charge elle-même sur une répétition', () => {
    // 100 × (1 + 1/30) = 103,3 : l'estimation reste une estimation
    expect(estimateOneRepMax(100, 1)).toBe(103.3)
  })

  it('refuse une charge ou des répétitions absentes', () => {
    expect(estimateOneRepMax(0, 8)).toBeNull()
    expect(estimateOneRepMax(100, 0)).toBeNull()
    expect(estimateOneRepMax(-10, 8)).toBeNull()
  })
})

describe('progression par exercice', () => {
  it('résume chaque séance et trie du plus ancien au plus récent', () => {
    const points = buildExerciseProgress(
      [
        session('2026-10-14T08:00:00.000Z', [set({ reps: 8, load: 80 })]),
        session('2026-10-07T08:00:00.000Z', [set({ reps: 10, load: 70 })]),
      ],
      'bench-press',
      PARIS,
    )

    expect(points.map((point) => point.day)).toEqual(['2026-10-07', '2026-10-14'])
    expect(points[1]).toMatchObject<Partial<ExercisePoint>>({
      maxLoadKg: 80,
      volumeKg: 640,
      reps: 8,
      topSet: { reps: 8, loadKg: 80 },
      estimatedOneRepMaxKg: 101.3,
    })
  })

  it('retient la série la plus forte, pas la plus lourde', () => {
    const points = buildExerciseProgress(
      [
        session('2026-10-14T08:00:00.000Z', [
          // 100 kg × 1 → 103,3 estimé
          set({ reps: 1, load: 100 }),
          // 90 kg × 5 → 105 estimé : c'est la meilleure série
          set({ reps: 5, load: 90 }),
        ]),
      ],
      'bench-press',
      PARIS,
    )

    expect(points[0]?.maxLoadKg).toBe(100)
    expect(points[0]?.topSet).toEqual({ reps: 5, loadKg: 90 })
    expect(points[0]?.estimatedOneRepMaxKg).toBe(105)
  })

  it('cumule plusieurs séries et ignore échauffements, séries non validées et autres exercices', () => {
    const points = buildExerciseProgress(
      [
        session('2026-10-14T08:00:00.000Z', [
          set({ reps: 10, load: 40, kind: 'warmup' }),
          set({ reps: 8, load: 80 }),
          set({ reps: 6, load: 80 }),
          set({ reps: 8, load: 80, status: 'planned' }),
          set({ reps: 8, load: null }),
        ]),
        session('2026-10-15T08:00:00.000Z', [set()], 'back-squat'),
      ],
      'bench-press',
      PARIS,
    )

    expect(points).toHaveLength(1)
    expect(points[0]).toMatchObject({ reps: 14, volumeKg: 1120, maxLoadKg: 80 })
  })

  it('convertit les livres en kilogrammes', () => {
    const points = buildExerciseProgress(
      [session('2026-10-14T08:00:00.000Z', [set({ reps: 5, load: 100, unit: 'lb' })])],
      'bench-press',
      PARIS,
    )
    expect(points[0]?.maxLoadKg).toBe(45.4)
    expect(points[0]?.volumeKg).toBe(227)
  })

  it('laisse de côté les séances non terminées et celles sans série exploitable', () => {
    const points = buildExerciseProgress(
      [
        session('2026-10-14T08:00:00.000Z', [set()], 'bench-press', 'abandoned'),
        session('2026-10-15T08:00:00.000Z', [set({ status: 'skipped' })]),
      ],
      'bench-press',
      PARIS,
    )
    expect(points).toEqual([])
  })

  it('rattache la séance au jour du pratiquant', () => {
    const late = [session('2026-10-14T21:30:00.000Z', [set()])]
    expect(buildExerciseProgress(late, 'bench-press', PARIS)[0]?.day).toBe('2026-10-14')
    expect(buildExerciseProgress(late, 'bench-press', { timeZone: 'Asia/Tokyo' })[0]?.day).toBe(
      '2026-10-15',
    )
  })

  it('expose la valeur demandée par la courbe', () => {
    const [point] = buildExerciseProgress(
      [session('2026-10-14T08:00:00.000Z', [set({ reps: 8, load: 80 })])],
      'bench-press',
      PARIS,
    )
    expect(metricValue(point!, 'maxLoad')).toBe(80)
    expect(metricValue(point!, 'volume')).toBe(640)
    expect(metricValue(point!, 'oneRepMax')).toBe(101.3)
  })
})

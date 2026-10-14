import { countsTowardVolume, toKg } from '@/domains/training/metrics'
import { dateKey, type DateKey } from '@/services/dates'
import type { Id, WorkoutSession } from '@/types/domain'

/**
 * Progression sur un exercice (CDC §5.2).
 *
 * Un point par séance, dans l'ordre chronologique. Les séries retenues sont
 * celles qui comptent déjà pour le volume : validées, hors échauffement,
 * charge et répétitions renseignées. Les charges sont ramenées en kilogrammes
 * pour que la courbe reste comparable quelle que soit l'unité saisie.
 */

/** Formule affichée à côté de toute estimation (CDC §5.2) */
export const ONE_REP_MAX_FORMULA = 'charge × (1 + répétitions ÷ 30)'
export const ONE_REP_MAX_SOURCE = 'formule d’Epley'

export interface TopSet {
  reps: number
  loadKg: number
}

export interface ExercisePoint {
  sessionId: Id
  day: DateKey
  /** Charge la plus lourde de la séance */
  maxLoadKg: number
  /** Volume de l'exercice sur cette séance */
  volumeKg: number
  /** Répétitions validées */
  reps: number
  /** Série la plus forte, au sens du 1RM estimé */
  topSet: TopSet
  /** 1RM **estimé**, jamais mesuré : toujours libellé comme tel dans l'UI */
  estimatedOneRepMaxKg: number
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * 1RM estimé par la formule d'Epley. Une série d'une répétition vaut sa
 * charge : la formule le donne déjà, on ne la corrige pas.
 */
export function estimateOneRepMax(loadKg: number, reps: number): number | null {
  if (loadKg <= 0 || reps <= 0) return null
  return round(loadKg * (1 + reps / 30))
}

export interface ProgressOptions {
  timeZone?: string
}

export function buildExerciseProgress(
  sessions: WorkoutSession[],
  exerciseId: Id,
  { timeZone }: ProgressOptions = {},
): ExercisePoint[] {
  const points: ExercisePoint[] = []

  for (const session of sessions) {
    if (session.status !== 'completed') continue

    const sets = session.exercises
      .filter((entry) => entry.exerciseId === exerciseId)
      .flatMap((entry) => entry.sets)
      .filter(countsTowardVolume)
      .map((set) => ({ reps: set.reps ?? 0, loadKg: toKg(set.load ?? 0, set.unit) }))

    if (sets.length === 0) continue

    let topSet = sets[0] as TopSet
    let best = estimateOneRepMax(topSet.loadKg, topSet.reps) ?? 0
    let volumeKg = 0
    let reps = 0
    let maxLoadKg = 0

    for (const set of sets) {
      const estimate = estimateOneRepMax(set.loadKg, set.reps) ?? 0
      if (estimate > best) {
        best = estimate
        topSet = set
      }
      volumeKg += set.loadKg * set.reps
      reps += set.reps
      maxLoadKg = Math.max(maxLoadKg, set.loadKg)
    }

    points.push({
      sessionId: session.id,
      day: dateKey(session.startedAt, timeZone),
      maxLoadKg: round(maxLoadKg),
      volumeKg: Math.round(volumeKg),
      reps,
      topSet: { reps: topSet.reps, loadKg: round(topSet.loadKg) },
      estimatedOneRepMaxKg: round(best),
    })
  }

  // Du plus ancien au plus récent : c'est le sens de lecture d'une courbe
  return points.sort((first, second) => first.day.localeCompare(second.day))
}

export type ProgressMetric = 'maxLoad' | 'volume' | 'oneRepMax'

export const METRIC_LABELS: Record<ProgressMetric, string> = {
  maxLoad: 'Charge max',
  volume: 'Volume',
  oneRepMax: '1RM estimé',
}

export function metricValue(point: ExercisePoint, metric: ProgressMetric): number {
  if (metric === 'volume') return point.volumeKg
  if (metric === 'oneRepMax') return point.estimatedOneRepMaxKg
  return point.maxLoadKg
}

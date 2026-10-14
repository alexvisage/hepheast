import type { SetEntry, WeightUnit, WorkoutExercise, WorkoutSession } from '@/types/domain'

/**
 * Calculs de séance (CDC §5.2).
 *
 * Volume = Σ (charge × répétitions) des séries réalisées de travail ou dégressives
 * dont la charge et les répétitions sont renseignées. Les séries d'échauffement,
 * ignorées ou prévues sont exclues, de même que les exercices sans charge mesurable.
 * Les charges en livres sont converties en kilogrammes.
 */

export const LB_TO_KG = 0.45359237

export function toKg(load: number, unit: WeightUnit): number {
  return unit === 'kg' ? load : load * LB_TO_KG
}

export function countsTowardVolume(set: SetEntry): boolean {
  return (
    set.status === 'done' &&
    set.kind !== 'warmup' &&
    set.reps !== null &&
    set.reps > 0 &&
    set.load !== null &&
    set.load > 0
  )
}

export function setVolumeKg(set: SetEntry): number {
  if (!countsTowardVolume(set)) return 0
  return toKg(set.load ?? 0, set.unit) * (set.reps ?? 0)
}

export interface ExerciseSummary {
  completedSets: number
  totalReps: number
  /** Volume arrondi au kilogramme près */
  volumeKg: number
}

export interface SessionSummary extends ExerciseSummary {
  exerciseCount: number
  durationSeconds: number
}

/** Détail d'un exercice dans le récapitulatif de séance (CDC §4.2) */
export function summarizeExercise(exercise: WorkoutExercise): ExerciseSummary {
  const doneSets = exercise.sets.filter((set) => set.status === 'done')
  return {
    completedSets: doneSets.length,
    totalReps: doneSets.reduce((sum, set) => sum + (set.reps ?? 0), 0),
    volumeKg: Math.round(doneSets.reduce((sum, set) => sum + setVolumeKg(set), 0)),
  }
}

export function summarizeSession(session: WorkoutSession, now = new Date()): SessionSummary {
  const doneSets = session.exercises.flatMap((exercise) =>
    exercise.sets.filter((set) => set.status === 'done'),
  )
  const end = session.endedAt ? new Date(session.endedAt) : now
  return {
    exerciseCount: session.exercises.filter((exercise) =>
      exercise.sets.some((set) => set.status === 'done'),
    ).length,
    completedSets: doneSets.length,
    totalReps: doneSets.reduce((sum, set) => sum + (set.reps ?? 0), 0),
    volumeKg: Math.round(doneSets.reduce((sum, set) => sum + setVolumeKg(set), 0)),
    durationSeconds: Math.max(
      0,
      Math.round((end.getTime() - Date.parse(session.startedAt)) / 1000),
    ),
  }
}

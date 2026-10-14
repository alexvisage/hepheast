/**
 * Modèle de domaine côté front (CDC §11).
 * Les identifiants sont des chaînes stables (UUID côté base).
 * Les dates sont des chaînes ISO 8601 en UTC.
 */

export type Id = string
export type IsoDateTime = string

export type WeightUnit = 'kg' | 'lb'

export interface MuscleGroup {
  id: Id
  name: string
}

export interface Equipment {
  id: Id
  name: string
}

export type MovementType = 'push' | 'pull' | 'legs' | 'core' | 'full-body'

export interface Exercise {
  id: Id
  name: string
  aliases: string[]
  description: string
  instructions: string[]
  equipmentId: Id
  primaryMuscleIds: Id[]
  secondaryMuscleIds: Id[]
  movement: MovementType
  /** L'exercice se pratique avec une charge mesurable (le volume est calculable) */
  loaded: boolean
}

export type SetKind = 'warmup' | 'working' | 'drop'
export type SetStatus = 'planned' | 'done' | 'skipped'

export interface SetEntry {
  id: Id
  kind: SetKind
  status: SetStatus
  reps: number | null
  /** Charge numérique toujours accompagnée de son unité */
  load: number | null
  unit: WeightUnit
  note?: string
  completedAt?: IsoDateTime
}

export interface WorkoutExercise {
  id: Id
  exerciseId: Id
  note?: string
  sets: SetEntry[]
}

export type WorkoutStatus = 'active' | 'paused' | 'completed' | 'abandoned'

export interface WorkoutSession {
  id: Id
  userId: Id
  title: string
  status: WorkoutStatus
  startedAt: IsoDateTime
  endedAt?: IsoDateTime
  note?: string
  /** Ressenti facultatif de 1 (très facile) à 5 (épuisant) */
  feeling?: 1 | 2 | 3 | 4 | 5
  exercises: WorkoutExercise[]
}

export interface UserProfile {
  id: Id
  email: string
  displayName: string
  preferences: UserPreferences
}

export interface UserPreferences {
  unit: WeightUnit
  weekStartsOn: 1 | 0
  timeZone: string
  defaultRestSeconds: number
  /** Lancer le repos automatiquement dès qu'une série est validée */
  autoRest: boolean
}

/** Dernière performance connue d'un exercice, affichée pendant la saisie */
export interface LastPerformance {
  sessionId: Id
  date: IsoDateTime
  sets: Pick<SetEntry, 'reps' | 'load' | 'unit' | 'kind'>[]
}

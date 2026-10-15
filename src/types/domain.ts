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

/** Prescription reprise du programme au démarrage, pour distinguer prévu et réalisé */
export interface Prescription {
  sets: number
  reps: number
  targetLoad?: number
  unit?: WeightUnit
  restSeconds?: number
  tempo?: string
  note?: string
}

export interface WorkoutExercise {
  id: Id
  exerciseId: Id
  note?: string
  /** Ce que le programme prévoyait ; la performance reste dans `sets` */
  prescription?: Prescription
  sets: SetEntry[]
}

export type WorkoutStatus = 'active' | 'paused' | 'completed' | 'abandoned'

/** Jour au format `YYYY-MM-DD`, exprimé dans le fuseau de l'utilisateur */
export type DayKey = string

/**
 * Séance planifiée au calendrier (CDC §11, ScheduledWorkout).
 * « Manquée » n'est pas stocké : il se déduit d'une date passée sans séance liée.
 */
export type ScheduledStatus = 'planned' | 'done' | 'moved'

export interface ScheduledWorkout {
  id: Id
  userId: Id
  date: DayKey
  title: string
  status: ScheduledStatus
  programId?: Id
  /** Jour du programme à reprendre au démarrage */
  programDayId?: Id
  /** Séance réalisée qui l'honore */
  sessionId?: Id
  /** Jour d'origine quand la séance a été déplacée */
  movedFrom?: DayKey
  note?: string
}

export interface WorkoutSession {
  id: Id
  userId: Id
  title: string
  status: WorkoutStatus
  /** Programme et version suivis, figés au démarrage (CDC §6.3) */
  programId?: Id
  programVersion?: number
  programDayId?: Id
  startedAt: IsoDateTime
  endedAt?: IsoDateTime
  note?: string
  /** Ressenti facultatif de 1 (très facile) à 5 (épuisant) */
  feeling?: 1 | 2 | 3 | 4 | 5
  exercises: WorkoutExercise[]
}

// --- Programmes (CDC §6, §11) --------------------------------------------

export type ProgramStatus = 'draft' | 'active' | 'archived'

export interface ProgramExercise {
  id: Id
  exerciseId: Id
  /** Séries prescrites */
  sets: number
  /** Répétitions cibles par série */
  reps: number
  restSeconds?: number
  /** Charge cible facultative, avec son unité */
  targetLoad?: number
  unit?: WeightUnit
  tempo?: string
  note?: string
}

export interface ProgramDay {
  id: Id
  name: string
  exercises: ProgramExercise[]
}

/**
 * Une version figée du contenu d'un programme. Modifier un programme déjà
 * utilisé crée une nouvelle version : les séances passées gardent la leur.
 */
export interface ProgramVersion {
  version: number
  createdAt: IsoDateTime
  /** Horodatage de la première séance démarrée sur cette version */
  usedAt?: IsoDateTime
  days: ProgramDay[]
}

export interface ProgramSchedule {
  startDate: DayKey
  /** Jours d'entraînement, 0 = dimanche … 6 = samedi */
  weekdays: number[]
}

export interface Program {
  id: Id
  userId: Id
  title: string
  description?: string
  status: ProgramStatus
  createdAt: IsoDateTime
  /** Numéro de la version en cours de modification */
  currentVersion: number
  versions: ProgramVersion[]
  /** Renseigné à l'activation */
  schedule?: ProgramSchedule
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

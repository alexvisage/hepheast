import type {
  DayKey,
  Equipment,
  Exercise,
  Id,
  LastPerformance,
  MovementType,
  MuscleGroup,
  ScheduledWorkout,
  UserPreferences,
  UserProfile,
  WorkoutSession,
  WorkoutStatus,
} from '@/types/domain'

/**
 * Contrats d'accès aux données.
 * Les composants et les stores ne dépendent que de ces interfaces :
 * l'adaptateur local actuel sera remplacé par l'adaptateur Supabase sans toucher à l'UI.
 */

export type ServiceErrorCode =
  'invalid-credentials' | 'email-taken' | 'not-authenticated' | 'not-found' | 'conflict' | 'network'

export class ServiceError extends Error {
  constructor(
    public readonly code: ServiceErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

export interface AuthService {
  getCurrentUser(): Promise<UserProfile | null>
  signIn(email: string, password: string): Promise<UserProfile>
  signUp(input: { email: string; password: string; displayName: string }): Promise<UserProfile>
  signOut(): Promise<void>
  updatePreferences(patch: Partial<UserPreferences>): Promise<UserProfile>
}

export interface ExerciseFilters {
  query?: string
  muscleId?: Id
  equipmentId?: Id
  movement?: MovementType
  favoritesOnly?: boolean
}

export interface ExerciseCatalogService {
  listMuscleGroups(): Promise<MuscleGroup[]>
  listEquipment(): Promise<Equipment[]>
  listExercises(filters?: ExerciseFilters): Promise<Exercise[]>
  getExercise(id: Id): Promise<Exercise>
  listFavoriteIds(): Promise<Id[]>
  setFavorite(id: Id, favorite: boolean): Promise<void>
}

/** Filtres de l'historique (CDC §4.3) */
export interface SessionFilters {
  /** Premier jour inclus, `YYYY-MM-DD` */
  from?: DayKey
  /** Dernier jour inclus */
  to?: DayKey
  exerciseId?: Id
  muscleId?: Id
  equipmentId?: Id
  programId?: Id
  status?: WorkoutStatus
}

export interface SessionPage {
  sessions: WorkoutSession[]
  /** Curseur de la page suivante ; absent quand tout est chargé */
  nextCursor?: string
}

export interface WorkoutService {
  getActiveSession(): Promise<WorkoutSession | null>
  startSession(input: { title: string }): Promise<WorkoutSession>
  /** Sauvegarde idempotente de l'état complet de la séance */
  saveSession(session: WorkoutSession): Promise<WorkoutSession>
  listCompletedSessions(limit?: number): Promise<WorkoutSession[]>
  /** Historique des séances achevées, par pages, du plus récent au plus ancien */
  listSessions(query?: {
    filters?: SessionFilters
    limit?: number
    cursor?: string
  }): Promise<SessionPage>
  getSession(id: Id): Promise<WorkoutSession>
  getLastPerformance(exerciseId: Id): Promise<LastPerformance | null>
}

/** Planification des séances à venir (CDC §4.5) */
export interface ScheduleService {
  /** Séances planifiées entre deux jours inclus */
  listScheduled(range: { from: DayKey; to: DayKey }): Promise<ScheduledWorkout[]>
  /** Prochaine séance planifiée à partir de ce jour, celle du jour comprise */
  getNextScheduled(from: DayKey): Promise<ScheduledWorkout | null>
  createScheduled(input: { date: DayKey; title: string; programId?: Id }): Promise<ScheduledWorkout>
  /** Déplacement : le jour d'origine est conservé pour l'affichage */
  moveScheduled(id: Id, date: DayKey): Promise<ScheduledWorkout>
  cancelScheduled(id: Id): Promise<void>
  /** Rattache la séance réalisée qui honore le créneau */
  linkSession(id: Id, sessionId: Id): Promise<ScheduledWorkout>
}

export interface Services {
  auth: AuthService
  exercises: ExerciseCatalogService
  workouts: WorkoutService
  schedule: ScheduleService
}

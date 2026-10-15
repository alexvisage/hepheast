import type {
  DayKey,
  Equipment,
  Exercise,
  Id,
  LastPerformance,
  MovementType,
  MuscleGroup,
  Program,
  ProgramDay,
  ProgramSchedule,
  ProgramStatus,
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
  updateProfile(patch: { displayName: string }): Promise<UserProfile>
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
  createScheduled(input: {
    date: DayKey
    title: string
    programId?: Id
    programDayId?: Id
  }): Promise<ScheduledWorkout>
  /** Déplacement : le jour d'origine est conservé pour l'affichage */
  moveScheduled(id: Id, date: DayKey): Promise<ScheduledWorkout>
  cancelScheduled(id: Id): Promise<void>
  /** Rattache la séance réalisée qui honore le créneau */
  linkSession(id: Id, sessionId: Id): Promise<ScheduledWorkout>
}

/** Modèle de départ proposé à la création d'un programme (CDC §6.1) */
export interface ProgramTemplateSummary {
  id: string
  title: string
  description: string
  weekdays: number[]
  dayCount: number
}

/** Programmes d'entraînement (CDC §6) */
export interface ProgramService {
  listPrograms(options?: { includeArchived?: boolean }): Promise<Program[]>
  getProgram(id: Id): Promise<Program>
  listTemplates(): Promise<ProgramTemplateSummary[]>
  /** Depuis zéro, ou depuis un modèle */
  createProgram(input: {
    title: string
    description?: string
    templateId?: string
  }): Promise<Program>
  renameProgram(id: Id, patch: { title: string; description?: string }): Promise<Program>
  /**
   * Enregistre les jours. Si la version courante a déjà servi à une séance,
   * une nouvelle version est créée : les séances passées gardent la leur.
   */
  saveDays(id: Id, days: ProgramDay[]): Promise<Program>
  duplicateProgram(id: Id): Promise<Program>
  setStatus(id: Id, status: ProgramStatus): Promise<Program>
  /** Programme actif : date de début et jours d'entraînement */
  setSchedule(id: Id, schedule: ProgramSchedule): Promise<Program>
  /** Fige la version courante : la prochaine modification en créera une autre */
  markVersionUsed(id: Id, version: number): Promise<Program>
  deleteProgram(id: Id): Promise<void>
}

export interface Services {
  auth: AuthService
  exercises: ExerciseCatalogService
  workouts: WorkoutService
  schedule: ScheduleService
  programs: ProgramService
}

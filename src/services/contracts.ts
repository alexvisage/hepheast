import type {
  Equipment,
  Exercise,
  Id,
  LastPerformance,
  MovementType,
  MuscleGroup,
  UserPreferences,
  UserProfile,
  WorkoutSession,
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

export interface WorkoutService {
  getActiveSession(): Promise<WorkoutSession | null>
  startSession(input: { title: string }): Promise<WorkoutSession>
  /** Sauvegarde idempotente de l'état complet de la séance */
  saveSession(session: WorkoutSession): Promise<WorkoutSession>
  listCompletedSessions(limit?: number): Promise<WorkoutSession[]>
  getLastPerformance(exerciseId: Id): Promise<LastPerformance | null>
}

export interface Services {
  auth: AuthService
  exercises: ExerciseCatalogService
  workouts: WorkoutService
}

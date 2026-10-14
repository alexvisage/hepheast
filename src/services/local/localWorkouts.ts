import { dateKey } from '@/services/dates'
import type { WorkoutSession } from '@/types/domain'

import { ServiceError, type SessionFilters, type WorkoutService } from '../contracts'

import { exercises as catalogue } from './seed'
import { createId, latency, readJson, writeJson } from './storage'

const SESSIONS_KEY = 'sessions'
const PAGE_SIZE = 10

/** Séances achevées, les plus récentes d'abord ; l'id départage deux séances du même instant */
function sortKey(session: WorkoutSession): string {
  return `${session.startedAt}|${session.id}`
}

/** Exercices du catalogue correspondant à un muscle ou un équipement */
function exerciseIdsMatching(filters: SessionFilters): Set<string> | null {
  if (!filters.muscleId && !filters.equipmentId) return null
  return new Set(
    catalogue
      .filter((exercise) => {
        if (
          filters.muscleId &&
          !exercise.primaryMuscleIds.includes(filters.muscleId) &&
          !exercise.secondaryMuscleIds.includes(filters.muscleId)
        ) {
          return false
        }
        return !(filters.equipmentId && exercise.equipmentId !== filters.equipmentId)
      })
      .map((exercise) => exercise.id),
  )
}

function matches(session: WorkoutSession, filters: SessionFilters): boolean {
  const day = dateKey(session.startedAt)
  if (filters.from && day < filters.from) return false
  if (filters.to && day > filters.to) return false
  if (filters.status && session.status !== filters.status) return false
  if (filters.exerciseId && !session.exercises.some((e) => e.exerciseId === filters.exerciseId)) {
    return false
  }
  const allowed = exerciseIdsMatching(filters)
  if (allowed && !session.exercises.some((entry) => allowed.has(entry.exerciseId))) return false
  return true
}

function load(): WorkoutSession[] {
  return readJson<WorkoutSession[]>(SESSIONS_KEY, [])
}

function persist(sessions: WorkoutSession[]): void {
  writeJson(SESSIONS_KEY, sessions)
}

export function createLocalWorkouts(getUserId: () => string | null): WorkoutService {
  const userId = () => getUserId() ?? 'anonymous'
  const mine = () => load().filter((session) => session.userId === userId())

  return {
    async getActiveSession() {
      await latency(60)
      return (
        mine().find((session) => session.status === 'active' || session.status === 'paused') ?? null
      )
    },

    async startSession({ title }) {
      await latency()
      const existing = await this.getActiveSession()
      if (existing) return existing
      const session: WorkoutSession = {
        id: createId(),
        userId: userId(),
        title,
        status: 'active',
        startedAt: new Date().toISOString(),
        exercises: [],
      }
      persist([...load(), session])
      return session
    },

    async saveSession(session) {
      await latency(80)
      // Idempotent : la même séance enregistrée deux fois remplace la précédente
      const sessions = load().filter((item) => item.id !== session.id)
      const copy = structuredClone(session)
      persist([...sessions, copy])
      return copy
    },

    async listCompletedSessions(limit = 20) {
      await latency()
      return mine()
        .filter((session) => session.status === 'completed')
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .slice(0, limit)
    },

    async listSessions({ filters = {}, limit = PAGE_SIZE, cursor } = {}) {
      await latency()
      // Les jours des filtres sont lus dans le fuseau du navigateur, comme l'affichage
      const ordered = mine()
        .filter((session) => session.status === 'completed' || session.status === 'abandoned')
        .filter((session) => matches(session, filters))
        .sort((first, second) => sortKey(second).localeCompare(sortKey(first)))

      const remaining = cursor ? ordered.filter((session) => sortKey(session) < cursor) : ordered
      const sessions = remaining.slice(0, limit)
      const last = sessions.at(-1)
      return {
        sessions,
        ...(remaining.length > sessions.length && last ? { nextCursor: sortKey(last) } : {}),
      }
    },

    async getSession(id) {
      await latency(60)
      const session = mine().find((item) => item.id === id)
      if (!session) throw new ServiceError('not-found', 'Séance introuvable')
      return session
    },

    async getLastPerformance(exerciseId) {
      const completed = mine()
        .filter((session) => session.status === 'completed')
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))

      for (const session of completed) {
        const entry = session.exercises.find((item) => item.exerciseId === exerciseId)
        const done = entry?.sets.filter((set) => set.status === 'done') ?? []
        if (done.length > 0) {
          return {
            sessionId: session.id,
            date: session.startedAt,
            sets: done.map(({ reps, load, unit, kind }) => ({ reps, load, unit, kind })),
          }
        }
      }
      return null
    },
  }
}

import type { WorkoutSession } from '@/types/domain'

import type { WorkoutService } from '../contracts'

import { createId, latency, readJson, writeJson } from './storage'

const SESSIONS_KEY = 'sessions'

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

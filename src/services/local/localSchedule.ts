import type { ScheduledWorkout } from '@/types/domain'

import { ServiceError, type ScheduleService } from '../contracts'

import { createId, latency, readJson, writeJson } from './storage'

/**
 * Planification de démonstration, stockée dans le navigateur.
 * Les jours sont des clés `YYYY-MM-DD` : la comparaison lexicographique
 * suffit pour trier et borner un intervalle.
 */

const SCHEDULE_KEY = 'scheduled'

function load(): ScheduledWorkout[] {
  return readJson<ScheduledWorkout[]>(SCHEDULE_KEY, [])
}

function persist(items: ScheduledWorkout[]): void {
  writeJson(SCHEDULE_KEY, items)
}

export function createLocalSchedule(getUserId: () => string | null): ScheduleService {
  const userId = () => getUserId() ?? 'anonymous'
  const mine = () =>
    load()
      .filter((item) => item.userId === userId())
      .sort((first, second) => first.date.localeCompare(second.date))

  function update(id: string, patch: Partial<ScheduledWorkout>): ScheduledWorkout {
    const items = load()
    const current = items.find((item) => item.id === id && item.userId === userId())
    if (!current) throw new ServiceError('not-found', 'Séance planifiée introuvable')
    const updated = { ...current, ...patch }
    persist(items.map((item) => (item.id === id ? updated : item)))
    return updated
  }

  return {
    async listScheduled({ from, to }) {
      await latency(60)
      return mine().filter((item) => item.date >= from && item.date <= to)
    },

    async getNextScheduled(from) {
      await latency(60)
      return mine().find((item) => item.date >= from && item.status !== 'done') ?? null
    },

    async createScheduled({ date, title, programId, programDayId }) {
      await latency()
      const scheduled: ScheduledWorkout = {
        id: createId(),
        userId: userId(),
        date,
        title,
        status: 'planned',
        ...(programId ? { programId } : {}),
        ...(programDayId ? { programDayId } : {}),
      }
      persist([...load(), scheduled])
      return scheduled
    },

    async moveScheduled(id, date) {
      await latency()
      const current = mine().find((item) => item.id === id)
      return update(id, {
        date,
        status: 'moved',
        // Le premier déplacement fixe l'origine, les suivants la conservent
        movedFrom: current?.movedFrom ?? current?.date,
      })
    },

    async cancelScheduled(id) {
      await latency()
      persist(load().filter((item) => !(item.id === id && item.userId === userId())))
    },

    async linkSession(id, sessionId) {
      await latency(60)
      return update(id, { sessionId, status: 'done' })
    },
  }
}

import { describe, expect, it } from 'vitest'

import type { SetEntry, WorkoutSession } from '@/types/domain'

import { summarizeWeek, weeklyStreak } from '../dashboard'

function set(overrides: Partial<SetEntry> = {}): SetEntry {
  return {
    id: crypto.randomUUID(),
    kind: 'working',
    status: 'done',
    reps: 10,
    load: 50,
    unit: 'kg',
    ...overrides,
  }
}

/** Séance terminée d'une heure, commençant à l'instant donné */
function session(startedAt: string, sets: SetEntry[] = [set()]): WorkoutSession {
  const start = new Date(startedAt)
  return {
    id: crypto.randomUUID(),
    userId: 'u1',
    title: 'Push',
    status: 'completed',
    startedAt,
    endedAt: new Date(start.getTime() + 3_600_000).toISOString(),
    exercises: [{ id: crypto.randomUUID(), exerciseId: 'bench-press', sets }],
  }
}

const PARIS = { timeZone: 'Europe/Paris', weekStartsOn: 1 } as const

describe('résumé de la semaine', () => {
  it('cumule les séances de la semaine et laisse les autres dehors', () => {
    const sessions = [
      session('2026-10-12T08:00:00.000Z'), // lundi, dans la semaine
      session('2026-10-14T08:00:00.000Z'), // mercredi
      session('2026-10-11T08:00:00.000Z'), // dimanche précédent, exclu
      session('2026-10-19T08:00:00.000Z'), // lundi suivant, exclu
    ]
    const week = summarizeWeek(sessions, '2026-10-14', PARIS)

    expect(week.sessions).toBe(2)
    expect(week.completedSets).toBe(2)
    expect(week.volumeKg).toBe(1000)
    expect(week.durationSeconds).toBe(7200)
    expect(week.days).toHaveLength(7)
    expect(week.days[0]?.key).toBe('2026-10-12')
  })

  it('range chaque séance sur son jour', () => {
    const week = summarizeWeek([session('2026-10-14T08:00:00.000Z')], '2026-10-14', PARIS)
    const loaded = week.days.filter((day) => day.sessions > 0)
    expect(loaded).toEqual([{ key: '2026-10-14', sessions: 1, volumeKg: 500 }])
  })

  it('rattache une séance tardive au jour du pratiquant', () => {
    // Dimanche 18 octobre 23 h à Paris : encore la semaine du 12 au 18
    const late = session('2026-10-18T21:00:00.000Z')
    expect(summarizeWeek([late], '2026-10-14', PARIS).sessions).toBe(1)
    // Lu en UTC+9, c'est déjà lundi : hors semaine
    expect(
      summarizeWeek([late], '2026-10-14', { timeZone: 'Asia/Tokyo', weekStartsOn: 1 }).sessions,
    ).toBe(0)
  })

  it('suit le premier jour de semaine choisi', () => {
    const sunday = session('2026-10-11T08:00:00.000Z')
    expect(summarizeWeek([sunday], '2026-10-14', PARIS).sessions).toBe(0)
    expect(
      summarizeWeek([sunday], '2026-10-14', { timeZone: 'Europe/Paris', weekStartsOn: 0 }).sessions,
    ).toBe(1)
  })

  it('ignore les séances abandonnées et les séries non validées', () => {
    const abandoned: WorkoutSession = {
      ...session('2026-10-14T08:00:00.000Z'),
      status: 'abandoned',
    }
    const planned = session('2026-10-15T08:00:00.000Z', [set({ status: 'planned' })])
    const week = summarizeWeek([abandoned, planned], '2026-10-14', PARIS)

    expect(week.sessions).toBe(1)
    expect(week.completedSets).toBe(0)
    expect(week.volumeKg).toBe(0)
  })

  it('rend une semaine vide sans séance', () => {
    const week = summarizeWeek([], '2026-10-14', PARIS)
    expect(week.sessions).toBe(0)
    expect(week.days.every((day) => day.sessions === 0)).toBe(true)
  })
})

describe('régularité', () => {
  it('compte les semaines consécutives avec au moins une séance', () => {
    const sessions = [
      session('2026-10-14T08:00:00.000Z'), // semaine en cours
      session('2026-10-07T08:00:00.000Z'), // semaine -1
      session('2026-09-30T08:00:00.000Z'), // semaine -2
      session('2026-09-16T08:00:00.000Z'), // semaine -4 : la chaîne est coupée
    ]
    expect(weeklyStreak(sessions, '2026-10-14', PARIS)).toBe(3)
  })

  it('rend zéro quand la semaine en cours est vide', () => {
    expect(weeklyStreak([session('2026-10-07T08:00:00.000Z')], '2026-10-14', PARIS)).toBe(0)
    expect(weeklyStreak([], '2026-10-14', PARIS)).toBe(0)
  })
})

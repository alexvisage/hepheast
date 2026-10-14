import { describe, expect, it } from 'vitest'

import type { ScheduledWorkout, WorkoutSession } from '@/types/domain'

import { buildCalendar, entryStatus } from '../schedule'

function plan(overrides: Partial<ScheduledWorkout> = {}): ScheduledWorkout {
  return {
    id: 'plan-1',
    userId: 'u1',
    date: '2026-10-14',
    title: 'Push',
    status: 'planned',
    ...overrides,
  }
}

function workout(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: 'session-1',
    userId: 'u1',
    title: 'Séance libre',
    status: 'completed',
    startedAt: '2026-10-14T08:00:00.000Z',
    exercises: [],
    ...overrides,
  }
}

const TODAY = '2026-10-14'

describe('statut d’un créneau', () => {
  it('est terminé dès qu’une séance y est rattachée', () => {
    expect(entryStatus(plan({ sessionId: 'session-1', date: '2026-10-01' }), TODAY)).toBe('done')
    expect(entryStatus(plan({ status: 'done' }), TODAY)).toBe('done')
  })

  it('devient manqué après la date, sans séance', () => {
    expect(entryStatus(plan({ date: '2026-10-13' }), TODAY)).toBe('missed')
    // Le jour même, rien n'est encore manqué
    expect(entryStatus(plan({ date: TODAY }), TODAY)).toBe('planned')
    expect(entryStatus(plan({ date: '2026-10-15' }), TODAY)).toBe('planned')
  })

  it('reste déplacé tant que la date n’est pas passée', () => {
    expect(entryStatus(plan({ status: 'moved', date: '2026-10-16' }), TODAY)).toBe('moved')
    // Une séance déplacée puis oubliée est manquée, comme les autres
    expect(entryStatus(plan({ status: 'moved', date: '2026-10-10' }), TODAY)).toBe('missed')
  })
})

describe('construction du calendrier', () => {
  it('groupe les entrées par jour', () => {
    const calendar = buildCalendar({
      scheduled: [plan(), plan({ id: 'plan-2', date: '2026-10-16', title: 'Jambes' })],
      sessions: [],
      today: TODAY,
      timeZone: 'Europe/Paris',
    })

    expect([...calendar.keys()]).toEqual(['2026-10-14', '2026-10-16'])
    expect(calendar.get('2026-10-14')?.[0]).toMatchObject({ title: 'Push', status: 'planned' })
  })

  it('n’affiche pas deux fois une séance qui honore un créneau', () => {
    const calendar = buildCalendar({
      scheduled: [plan({ sessionId: 'session-1' })],
      sessions: [workout()],
      today: TODAY,
      timeZone: 'Europe/Paris',
    })

    const day = calendar.get('2026-10-14') ?? []
    expect(day).toHaveLength(1)
    expect(day[0]).toMatchObject({ title: 'Push', status: 'done', sessionId: 'session-1' })
  })

  it('ajoute les séances libres au jour où elles ont commencé', () => {
    const calendar = buildCalendar({
      scheduled: [],
      sessions: [workout({ startedAt: '2026-10-14T21:30:00.000Z' })],
      today: TODAY,
      timeZone: 'Europe/Paris',
    })
    expect(calendar.get('2026-10-14')?.[0]?.title).toBe('Séance libre')

    // Vu de Tokyo, la même séance tombe le lendemain
    const tokyo = buildCalendar({
      scheduled: [],
      sessions: [workout({ startedAt: '2026-10-14T21:30:00.000Z' })],
      today: TODAY,
      timeZone: 'Asia/Tokyo',
    })
    expect(tokyo.get('2026-10-15')?.[0]?.title).toBe('Séance libre')
  })

  it('distingue une séance abandonnée', () => {
    const calendar = buildCalendar({
      scheduled: [],
      sessions: [workout({ status: 'abandoned' })],
      today: TODAY,
    })
    expect(calendar.get('2026-10-14')?.[0]?.abandoned).toBe(true)
  })

  it('laisse de côté une séance encore en cours', () => {
    const calendar = buildCalendar({
      scheduled: [],
      sessions: [workout({ status: 'active' })],
      today: TODAY,
    })
    expect(calendar.size).toBe(0)
  })

  it('conserve le jour d’origine d’une séance déplacée', () => {
    const calendar = buildCalendar({
      scheduled: [plan({ date: '2026-10-16', status: 'moved', movedFrom: '2026-10-14' })],
      sessions: [],
      today: TODAY,
    })
    expect(calendar.get('2026-10-16')?.[0]).toMatchObject({
      status: 'moved',
      movedFrom: '2026-10-14',
    })
  })
})

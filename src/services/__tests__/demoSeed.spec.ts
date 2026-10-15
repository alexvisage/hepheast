import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { summarizeSession } from '@/domains/training/metrics'
import { services } from '@/services'
import { addDays, startOfWeek, todayKey } from '@/services/dates'

import { DEMO_EMAIL, DEMO_PASSWORD, seedDemoAccount } from '../local/demoSeed'

/**
 * Le jeu de démonstration sert à regarder les écrans remplis : s'il se
 * dégrade en silence, la démo mentirait. Ces tests vérifient la forme du
 * mois reconstitué, pas chaque valeur.
 */
describe('compte de démonstration', () => {
  beforeEach(() => {
    localStorage.clear()
    // Un jeudi, pour un découpage de semaines stable
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-15T10:00:00.000Z') })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('crée un compte connectable avec ses préférences', async () => {
    const result = await seedDemoAccount()

    expect(result.email).toBe(DEMO_EMAIL)
    const profile = await services.auth.signIn(DEMO_EMAIL, DEMO_PASSWORD)
    expect(profile.displayName).toBe('Alex')
    expect(profile.preferences).toMatchObject({
      unit: 'kg',
      weekStartsOn: 1,
      timeZone: 'Europe/Paris',
    })
  })

  it('laisse un mois de séances terminées, dont une abandonnée', async () => {
    const result = await seedDemoAccount()

    expect(result.completed).toBe(16)
    expect(result.missed).toBe(2)
    expect(result.planned).toBeGreaterThan(0)

    const page = await services.workouts.listSessions({ limit: 50 })
    expect(page.sessions).toHaveLength(result.completed + 1)
    expect(page.sessions.filter((item) => item.status === 'abandoned')).toHaveLength(1)
  })

  it('remplit des séances crédibles : échauffement, séries validées, volume', async () => {
    await seedDemoAccount()
    const completed = await services.workouts.listCompletedSessions(50)
    const last = completed[0]!

    expect(last.exercises.length).toBeGreaterThanOrEqual(3)
    expect(last.exercises[0]?.sets[0]?.kind).toBe('warmup')
    expect(last.exercises[0]?.prescription).toBeDefined()

    const totals = summarizeSession(last)
    expect(totals.completedSets).toBeGreaterThan(10)
    expect(totals.volumeKg).toBeGreaterThan(2000)
    expect(totals.durationSeconds).toBeGreaterThan(50 * 60)
  })

  it('fait progresser les charges au fil des semaines', async () => {
    await seedDemoAccount()
    const sessions = await services.workouts.listCompletedSessions(50)

    const benchLoads = sessions
      .filter((session) => session.exercises.some((item) => item.exerciseId === 'bench-press'))
      .sort((first, second) => first.startedAt.localeCompare(second.startedAt))
      .map((session) =>
        Math.max(
          ...session.exercises
            .filter((item) => item.exerciseId === 'bench-press')
            .flatMap((item) => item.sets.map((set) => set.load ?? 0)),
        ),
      )

    expect(benchLoads.length).toBeGreaterThanOrEqual(3)
    expect(benchLoads.at(-1)!).toBeGreaterThan(benchLoads[0]!)
  })

  it('active un programme dont la version est figée', async () => {
    await seedDemoAccount()
    const [program] = await services.programs.listPrograms()

    expect(program).toMatchObject({ title: 'Upper / Lower', status: 'active' })
    expect(program?.schedule?.weekdays).toEqual([1, 2, 4, 5])
    expect(program?.versions[0]?.usedAt).toBeTruthy()
    expect(program?.versions[0]?.days).toHaveLength(4)
  })

  it('laisse le calendrier avec du terminé, du manqué et du planifié', async () => {
    await seedDemoAccount()
    const today = todayKey('Europe/Paris')
    const scheduled = await services.schedule.listScheduled({
      from: startOfWeek(addDays(today, -35), 1),
      to: addDays(today, 35),
    })

    const done = scheduled.filter((item) => item.status === 'done')
    const upcoming = scheduled.filter((item) => item.date >= today)
    const missed = scheduled.filter((item) => item.date < today && item.status !== 'done')

    expect(done).toHaveLength(16)
    expect(missed).toHaveLength(2)
    expect(upcoming.length).toBeGreaterThan(0)
    // Chaque créneau sait de quel jour de programme il vient
    expect(scheduled.every((item) => item.programId && item.programDayId)).toBe(true)
  })

  it('propose une prochaine séance à démarrer', async () => {
    await seedDemoAccount()
    const next = await services.schedule.getNextScheduled(todayKey('Europe/Paris'))
    expect(next?.programDayId).toBeTruthy()
  })

  it('marque quelques exercices en favoris', async () => {
    await seedDemoAccount()
    expect(await services.exercises.listFavoriteIds()).toEqual([
      'bench-press',
      'back-squat',
      'deadlift',
      'pull-up',
    ])
  })

  it('repart d’un jeu propre à chaque appel', async () => {
    await seedDemoAccount()
    await seedDemoAccount()

    expect(await services.programs.listPrograms()).toHaveLength(1)
    const page = await services.workouts.listSessions({ limit: 50 })
    expect(page.sessions).toHaveLength(17)
  })
})

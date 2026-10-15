import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { services } from '@/services'
import { todayKey } from '@/services/dates'
import { useSessionStore } from '@/stores/session'
import type { Program } from '@/types/domain'

import { useActiveSessionStore } from '../activeSessionStore'

/**
 * Démarrage pré-rempli depuis un jour de programme (SCRUM-176, AC de SCRUM-115).
 */
function signIn() {
  useSessionStore().user = {
    id: 'anonymous',
    email: 'alex@example.com',
    displayName: 'Alex',
    preferences: {
      unit: 'kg',
      weekStartsOn: 1,
      timeZone: 'Europe/Paris',
      defaultRestSeconds: 120,
      autoRest: true,
    },
  }
}

/** Programme d'un jour : 4 × 8 à 80 kg au développé couché, 3 × 10 au rowing */
async function programWithDay(): Promise<Program> {
  const created = await services.programs.createProgram({ title: 'Push' })
  return services.programs.saveDays(created.id, [
    {
      id: 'day-1',
      name: 'Haut du corps',
      exercises: [
        {
          id: 'pe-1',
          exerciseId: 'bench-press',
          sets: 4,
          reps: 8,
          targetLoad: 80,
          restSeconds: 150,
          tempo: '3-1-1',
          note: 'Omoplates serrées',
        },
        { id: 'pe-2', exerciseId: 'barbell-row', sets: 3, reps: 10 },
      ],
    },
  ])
}

function currentDay(program: Program) {
  return program.versions.find((version) => version.version === program.currentVersion)!.days[0]!
}

describe('séance démarrée depuis un programme', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    signIn()
  })

  // Coupe la sauvegarde différée : sinon elle repersiste la séance pendant le test suivant
  afterEach(() => {
    useActiveSessionStore().reset()
  })

  it('pré-remplit les exercices et les séries prévues', async () => {
    const program = await programWithDay()
    const store = useActiveSessionStore()

    await store.startFromProgram(program, currentDay(program))

    const session = store.session!
    expect(session.title).toBe('Haut du corps')
    expect(session.exercises).toHaveLength(2)

    const [bench, row] = session.exercises
    expect(bench?.sets).toHaveLength(4)
    expect(bench?.sets[0]).toMatchObject({ reps: 8, load: 80, unit: 'kg', status: 'planned' })
    // Sans charge cible, la série reste à remplir
    expect(row?.sets).toHaveLength(3)
    expect(row?.sets[0]).toMatchObject({ reps: 10, load: null })
    await store.flush()
  })

  it('garde la prescription à côté de la performance', async () => {
    const program = await programWithDay()
    const store = useActiveSessionStore()

    await store.startFromProgram(program, currentDay(program))

    expect(store.session?.exercises[0]?.prescription).toEqual({
      sets: 4,
      reps: 8,
      targetLoad: 80,
      restSeconds: 150,
      tempo: '3-1-1',
      note: 'Omoplates serrées',
    })
    // La séance sait de quel programme et de quelle version elle vient
    expect(store.session).toMatchObject({
      programId: program.id,
      programVersion: 1,
      programDayId: 'day-1',
    })
    await store.flush()
  })

  it('fige la version du programme : la modifier ensuite en crée une nouvelle', async () => {
    const program = await programWithDay()
    const store = useActiveSessionStore()

    await store.startFromProgram(program, currentDay(program))

    const used = await services.programs.getProgram(program.id)
    expect(used.versions[0]?.usedAt).toBeTruthy()

    const edited = await services.programs.saveDays(program.id, [])
    expect(edited.currentVersion).toBe(2)
    expect(edited.versions[0]?.days[0]?.exercises).toHaveLength(2)
    await store.flush()
  })

  it('n’écrase pas une séance déjà en cours', async () => {
    const program = await programWithDay()
    const store = useActiveSessionStore()
    await store.start('Séance libre')
    const bench = await services.exercises.getExercise('bench-press')
    await store.addExercise(bench)

    const started = await store.startFromProgram(program, currentDay(program))

    expect(started?.title).toBe('Séance libre')
    expect(store.session?.exercises).toHaveLength(1)
    expect(store.session?.programId).toBeUndefined()
    await store.flush()
  })

  it('démarre une séance planifiée issue d’un programme et la rattache', async () => {
    const program = await programWithDay()
    const day = currentDay(program)
    const scheduled = await services.schedule.createScheduled({
      date: todayKey('Europe/Paris'),
      title: day.name,
      programId: program.id,
      programDayId: day.id,
    })
    const store = useActiveSessionStore()

    await store.startFromScheduled(scheduled)

    expect(store.session?.exercises).toHaveLength(2)
    const [linked] = await services.schedule.listScheduled({
      from: scheduled.date,
      to: scheduled.date,
    })
    expect(linked).toMatchObject({ sessionId: store.session?.id, status: 'done' })
    await store.flush()
  })

  it('démarre une séance planifiée libre sans rien pré-remplir', async () => {
    const scheduled = await services.schedule.createScheduled({
      date: todayKey('Europe/Paris'),
      title: 'Séance libre',
    })
    const store = useActiveSessionStore()

    await store.startFromScheduled(scheduled)

    expect(store.session?.title).toBe('Séance libre')
    expect(store.session?.exercises).toEqual([])
    expect(store.session?.programId).toBeUndefined()
    await store.flush()
  })
})

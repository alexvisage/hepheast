import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { services } from '@/services'

import { useActiveSessionStore } from '../activeSessionStore'

describe('séance active', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('démarre une séance et la retrouve au rechargement', async () => {
    const store = useActiveSessionStore()
    await store.start('Push')
    setActivePinia(createPinia())
    const reloaded = useActiveSessionStore()
    await reloaded.load()
    expect(reloaded.session?.title).toBe('Push')
  })

  it('pré-remplit une nouvelle série avec la précédente', async () => {
    const store = useActiveSessionStore()
    await store.start()
    const bench = await services.exercises.getExercise('bench-press')
    const entry = await store.addExercise(bench)
    store.updateSet(entry!.id, entry!.sets[0]!.id, { reps: 8, load: 80 })
    store.addSet(entry!.id)
    expect(store.session?.exercises[0]?.sets[1]).toMatchObject({
      reps: 8,
      load: 80,
      status: 'planned',
    })
    await store.flush()
  })

  it('sauvegarde automatiquement après une modification', async () => {
    const store = useActiveSessionStore()
    await store.start()
    const squat = await services.exercises.getExercise('back-squat')
    await store.addExercise(squat)
    expect(store.sync).toBe('pending')
    await vi.waitFor(() => expect(store.sync).toBe('saved'))
    const persisted = await services.workouts.getActiveSession()
    expect(persisted?.exercises).toHaveLength(1)
  })

  it('termine la séance en conservant les séries non validées comme ignorées', async () => {
    const store = useActiveSessionStore()
    await store.start()
    const squat = await services.exercises.getExercise('back-squat')
    const entry = await store.addExercise(squat)
    store.updateSet(entry!.id, entry!.sets[0]!.id, { reps: 5, load: 100 })
    store.toggleSetDone(entry!.id, entry!.sets[0]!.id)
    store.addSet(entry!.id)
    const completed = await store.finish()
    expect(completed?.status).toBe('completed')
    expect(completed?.exercises[0]?.sets.map((set) => set.status)).toEqual(['done', 'skipped'])
    expect(store.session).toBeNull()
    expect(await services.workouts.listCompletedSessions()).toHaveLength(1)
  })
})

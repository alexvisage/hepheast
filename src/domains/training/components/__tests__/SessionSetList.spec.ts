import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'

import { services } from '@/services'
import { useSessionStore } from '@/stores/session'
import type { WorkoutExercise } from '@/types/domain'

import { useActiveSessionStore } from '../../activeSessionStore'
import { useRestTimerStore } from '../../restTimerStore'
import SessionSetList from '../SessionSetList.vue'

vi.mock('../../restSignal', () => ({ signalRestEnd: vi.fn<() => void>() }))

/**
 * Saisie de série en situation : bornes, valeurs invalides et erreurs
 * d'enregistrement (SCRUM-141, AC-12).
 */
async function startWithBench(autoRest = true) {
  useSessionStore().user = {
    id: 'u1',
    email: 'alex@example.com',
    displayName: 'Alex',
    preferences: {
      unit: 'kg',
      weekStartsOn: 1,
      timeZone: 'Europe/Paris',
      defaultRestSeconds: 120,
      autoRest,
    },
  }
  const store = useActiveSessionStore()
  await store.start('Push')
  const bench = await services.exercises.getExercise('bench-press')
  const entry = await store.addExercise(bench)
  return { store, entry: entry as WorkoutExercise }
}

function mountList(entry: WorkoutExercise) {
  return mount(SessionSetList, { props: { entry }, attachTo: document.body })
}

/** Champs d'une ligne de série : [répétitions, charge] */
function fields(wrapper: ReturnType<typeof mountList>, row = 0) {
  const inputs = wrapper.findAll('.set-row')[row]!.findAll('input')
  return { reps: inputs[0]!, load: inputs[1]! }
}

describe('saisie des séries', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('enregistre répétitions et charge décimale dans la séance', async () => {
    const { store, entry } = await startWithBench()
    const wrapper = mountList(entry)
    const { reps, load } = fields(wrapper)

    await reps.setValue('8')
    await reps.trigger('blur')
    await load.setValue('82,5')
    await load.trigger('blur')

    expect(store.session?.exercises[0]?.sets[0]).toMatchObject({ reps: 8, load: 82.5 })
    await store.flush()
  })

  it('borne les répétitions à 100 et la charge à 500', async () => {
    const { store, entry } = await startWithBench()
    const wrapper = mountList(entry)
    const { reps, load } = fields(wrapper)

    await reps.setValue('250')
    await reps.trigger('blur')
    await load.setValue('900')
    await load.trigger('blur')

    expect(store.session?.exercises[0]?.sets[0]).toMatchObject({ reps: 100, load: 500 })
    await store.flush()
  })

  it('ramène une valeur négative au minimum', async () => {
    const { store, entry } = await startWithBench()
    const wrapper = mountList(entry)

    await fields(wrapper).reps.setValue('-5')
    await fields(wrapper).reps.trigger('blur')

    expect(store.session?.exercises[0]?.sets[0]?.reps).toBe(0)
    await store.flush()
  })

  it('vide le champ sur une saisie non numérique sans perdre la série', async () => {
    const { store, entry } = await startWithBench()
    const wrapper = mountList(entry)

    await fields(wrapper).load.setValue('lourd')
    await fields(wrapper).load.trigger('blur')

    expect(store.session?.exercises[0]?.sets[0]?.load).toBeNull()
    expect(store.session?.exercises[0]?.sets).toHaveLength(1)
    expect(fields(wrapper).load.element.value).toBe('')
    await store.flush()
  })

  it('conserve la saisie quand l’enregistrement échoue', async () => {
    const { store, entry } = await startWithBench()
    const wrapper = mountList(entry)
    vi.spyOn(services.workouts, 'saveSession').mockRejectedValueOnce(new Error('réseau'))

    await fields(wrapper).reps.setValue('12')
    await fields(wrapper).reps.trigger('blur')
    await store.flush()

    expect(store.sync).toBe('error')
    expect(store.session?.exercises[0]?.sets[0]?.reps).toBe(12)
    expect(fields(wrapper).reps.element.value).toBe('12')
  })

  it('ajoute une série pré-remplie avec la précédente', async () => {
    const { store, entry } = await startWithBench()
    const wrapper = mountList(entry)
    await fields(wrapper).reps.setValue('8')
    await fields(wrapper).reps.trigger('blur')
    await fields(wrapper).load.setValue('80')
    await fields(wrapper).load.trigger('blur')

    const add = wrapper.findAll('button').find((button) => button.text() === 'Ajouter une série')
    await add!.trigger('click')

    expect(wrapper.findAll('.set-row')).toHaveLength(2)
    expect(store.session?.exercises[0]?.sets[1]).toMatchObject({ reps: 8, load: 80 })
    await store.flush()
  })

  it('copie la série précédente sur demande', async () => {
    const { store, entry } = await startWithBench()
    const wrapper = mountList(entry)
    await fields(wrapper).reps.setValue('8')
    await fields(wrapper).reps.trigger('blur')
    store.addSet(entry.id)
    store.updateSet(entry.id, store.session!.exercises[0]!.sets[1]!.id, { reps: null })
    await wrapper.vm.$nextTick()

    await wrapper.get('[aria-label="Copier la série 1 dans la série 2"]').trigger('click')

    expect(store.session?.exercises[0]?.sets[1]?.reps).toBe(8)
    await store.flush()
  })

  it('lance le repos quand une série est validée', async () => {
    const { store, entry } = await startWithBench()
    const rest = useRestTimerStore()
    const wrapper = mountList(entry)

    await wrapper.get('[aria-label="Valider la série 1"]').trigger('click')

    expect(store.session?.exercises[0]?.sets[0]?.status).toBe('done')
    expect(rest.isRunning).toBe(true)
    rest.stop()
    await store.flush()
  })

  it('ne lance pas le repos si la préférence est désactivée', async () => {
    const { store, entry } = await startWithBench(false)
    const rest = useRestTimerStore()
    const wrapper = mountList(entry)

    await wrapper.get('[aria-label="Valider la série 1"]').trigger('click')

    expect(store.session?.exercises[0]?.sets[0]?.status).toBe('done')
    expect(rest.isActive).toBe(false)
    await store.flush()
  })

  it('bascule une série en ignorée puis la rétablit', async () => {
    const { store, entry } = await startWithBench()
    const wrapper = mountList(entry)
    const skip = () => wrapper.get('[aria-label="Ignorer la série 1"]')

    await skip().trigger('click')
    expect(store.session?.exercises[0]?.sets[0]?.status).toBe('skipped')

    await skip().trigger('click')
    expect(store.session?.exercises[0]?.sets[0]?.status).toBe('planned')
    await store.flush()
  })

  it('supprime une série non validée sans confirmation', async () => {
    const { store, entry } = await startWithBench()
    store.addSet(entry.id)
    const wrapper = mountList(entry)

    await wrapper.get('[aria-label="Supprimer la série 2"]').trigger('click')

    expect(store.session?.exercises[0]?.sets).toHaveLength(1)
    await store.flush()
  })

  it('demande confirmation avant de supprimer une série validée', async () => {
    const { store, entry } = await startWithBench()
    const wrapper = mountList(entry)
    await fields(wrapper).reps.setValue('8')
    await fields(wrapper).reps.trigger('blur')
    await fields(wrapper).load.setValue('80')
    await fields(wrapper).load.trigger('blur')
    await wrapper.get('[aria-label="Valider la série 1"]').trigger('click')
    useRestTimerStore().stop()

    await wrapper.get('[aria-label="Supprimer la série 1"]').trigger('click')
    const dialog = wrapper.get('dialog')
    expect(dialog.element.open).toBe(true)
    expect(dialog.text()).toContain('8 × 80 kg')
    expect(store.session?.exercises[0]?.sets).toHaveLength(1)

    const confirm = dialog.findAll('button').find((button) => button.text() === 'Supprimer')
    await confirm!.trigger('click')
    expect(store.session?.exercises[0]?.sets).toHaveLength(0)
    await store.flush()
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'

import { services } from '@/services'

import { useActiveSessionStore } from '../../activeSessionStore'
import SessionExerciseList from '../SessionExerciseList.vue'

/** Séance de deux exercices : développé couché puis squat */
async function startSession() {
  const store = useActiveSessionStore()
  await store.start('Push')
  const bench = await services.exercises.getExercise('bench-press')
  const squat = await services.exercises.getExercise('back-squat')
  await store.addExercise(bench)
  await store.addExercise(squat)
  return store
}

function names(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('.session-exercise__name').map((node) => node.text())
}

/** Chaque série porte aussi son dialogue de suppression : on cible celui qui est ouvert */
function openDialog(wrapper: ReturnType<typeof mount>) {
  const dialog = wrapper.findAll('dialog').find((node) => node.element.open)
  expect(dialog).toBeDefined()
  return dialog!
}

describe('SessionExerciseList', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('affiche les exercices dans l’ordre de la séance', async () => {
    await startSession()
    const wrapper = mount(SessionExerciseList)
    expect(names(wrapper)).toEqual(['Développé couché', 'Squat'])
    expect(wrapper.get('.session-exercise__rank').text()).toBe('Exercice 1 sur 2')
  })

  it('désactive monter sur le premier et descendre sur le dernier', async () => {
    await startSession()
    const wrapper = mount(SessionExerciseList)
    expect(
      wrapper.get('[aria-label="Monter Développé couché"]').attributes('disabled'),
    ).toBeDefined()
    expect(
      wrapper.get('[aria-label="Descendre Développé couché"]').attributes('disabled'),
    ).toBeUndefined()
    expect(wrapper.get('[aria-label="Monter Squat"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[aria-label="Descendre Squat"]').attributes('disabled')).toBeDefined()
  })

  it('réordonne au clavier et annonce la nouvelle position', async () => {
    const store = await startSession()
    const wrapper = mount(SessionExerciseList)

    await wrapper.get('[aria-label="Descendre Développé couché"]').trigger('click')

    expect(names(wrapper)).toEqual(['Squat', 'Développé couché'])
    expect(store.session?.exercises[0]?.exerciseId).toBe('back-squat')
    expect(wrapper.get('[role="status"]').text()).toBe(
      'Développé couché déplacé en position 2 sur 2',
    )
    await store.flush()
  })

  it('retire sans confirmation un exercice sans série validée', async () => {
    const store = await startSession()
    const wrapper = mount(SessionExerciseList)

    await wrapper.get('[aria-label="Retirer Développé couché de la séance"]').trigger('click')

    expect(names(wrapper)).toEqual(['Squat'])
    expect(store.session?.exercises).toHaveLength(1)
    await store.flush()
  })

  it('demande confirmation quand des séries sont saisies', async () => {
    const store = await startSession()
    const entry = store.session!.exercises[0]!
    store.updateSet(entry.id, entry.sets[0]!.id, { reps: 8, load: 80 })
    store.toggleSetDone(entry.id, entry.sets[0]!.id)
    const wrapper = mount(SessionExerciseList, { attachTo: document.body })

    await wrapper.get('[aria-label="Retirer Développé couché de la séance"]').trigger('click')

    const dialog = openDialog(wrapper)
    expect(dialog.text()).toContain('Développé couché compte 1 série saisie.')
    expect(names(wrapper)).toEqual(['Développé couché', 'Squat'])

    const confirm = dialog.findAll('button').find((button) => button.text() === 'Retirer')
    await confirm!.trigger('click')

    expect(names(wrapper)).toEqual(['Squat'])
    expect(store.session?.exercises).toHaveLength(1)
    await store.flush()
  })

  it('demande confirmation pour une saisie non encore validée', async () => {
    const store = await startSession()
    const entry = store.session!.exercises[0]!
    store.updateSet(entry.id, entry.sets[0]!.id, { reps: 8 })
    const wrapper = mount(SessionExerciseList, { attachTo: document.body })

    await wrapper.get('[aria-label="Retirer Développé couché de la séance"]').trigger('click')

    expect(openDialog(wrapper).text()).toContain('1 série saisie')
    expect(names(wrapper)).toEqual(['Développé couché', 'Squat'])
    await store.flush()
  })

  it('conserve l’exercice si la confirmation est annulée', async () => {
    const store = await startSession()
    const entry = store.session!.exercises[0]!
    store.toggleSetDone(entry.id, entry.sets[0]!.id)
    const wrapper = mount(SessionExerciseList, { attachTo: document.body })

    await wrapper.get('[aria-label="Retirer Développé couché de la séance"]').trigger('click')
    const cancel = wrapper
      .get('dialog')
      .findAll('button')
      .find((button) => button.text() === 'Annuler')
    await cancel!.trigger('click')

    expect(names(wrapper)).toEqual(['Développé couché', 'Squat'])
    await store.flush()
  })
})

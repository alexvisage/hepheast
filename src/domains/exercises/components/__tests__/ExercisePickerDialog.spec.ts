import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'

import { services } from '@/services'

import ExercisePickerDialog from '../ExercisePickerDialog.vue'

/** Monte le sélecteur fermé puis l'ouvre, et attend l'affichage du catalogue */
async function openPicker(props: Record<string, unknown> = {}) {
  const wrapper = mount(ExercisePickerDialog, {
    props: { open: false, ...props },
    attachTo: document.body,
  })
  await wrapper.setProps({ open: true })
  await vi.waitFor(() => expect(wrapper.findAll('.exercise-row').length).toBeGreaterThan(0))
  return wrapper
}

describe('ExercisePickerDialog', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('n’ouvre le dialogue natif qu’à la demande', async () => {
    const wrapper = mount(ExercisePickerDialog, { props: { open: false } })
    const dialog = wrapper.get('dialog')
    expect(dialog.element.open).toBe(false)
    // Le contenu n'est monté qu'à l'ouverture : la recherche repart propre
    expect(wrapper.find('.exercise-search').exists()).toBe(false)

    await wrapper.setProps({ open: true })
    expect(dialog.element.open).toBe(true)
    expect(wrapper.find('.exercise-search').exists()).toBe(true)
  })

  it('place le curseur dans la recherche à l’ouverture', async () => {
    const wrapper = await openPicker()
    expect(wrapper.get('input[type="search"]').attributes('autofocus')).toBeDefined()
  })

  it('émet l’exercice choisi et reste ouvert pour en enchaîner un autre', async () => {
    const wrapper = await openPicker()
    await wrapper.get('input[type="search"]').setValue('développé couché')
    await vi.waitFor(() => expect(wrapper.findAll('.exercise-row')).toHaveLength(1))

    await wrapper.get('.exercise-row').trigger('click')

    const selected = wrapper.emitted('select')?.[0]?.[0] as { id: string } | undefined
    expect(selected?.id).toBe('bench-press')
    expect(wrapper.get('dialog').element.open).toBe(true)
    expect(wrapper.get('.picker__feedback').text()).toBe('Développé couché ajouté')
  })

  it('remonte les favoris en tête de liste', async () => {
    await services.exercises.setFavorite('back-squat', true)
    const wrapper = await openPicker()
    const names = wrapper.findAll('.exercise-row__name').map((node) => node.text())

    expect(names[0]).toBe('Squat')
    // Le reste du catalogue garde son ordre
    expect(names.filter((name) => name === 'Squat')).toHaveLength(1)
  })

  it('reprend le libellé d’action fourni par l’appelant', async () => {
    const wrapper = await openPicker({ selectLabel: 'Ajouter à la séance' })
    expect(wrapper.get('.exercise-row .visually-hidden').text()).toBe('Ajouter à la séance')
  })

  it('se ferme par le bouton Fermer et par la touche Échap', async () => {
    const wrapper = await openPicker()

    await wrapper.get('[aria-label="Fermer"]').trigger('click')
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
    await wrapper.setProps({ open: true })

    // Échap sur un <dialog> natif déclenche l'événement « cancel »
    await wrapper.get('dialog').trigger('cancel')
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('se ferme par le bouton Terminé', async () => {
    const wrapper = await openPicker()
    const done = wrapper.findAll('button').find((button) => button.text() === 'Terminé')
    await done!.trigger('click')
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })
})

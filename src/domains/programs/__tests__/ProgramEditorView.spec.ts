import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { routes } from '@/app/router/routes'
import { services } from '@/services'
import { useToastStore } from '@/stores/toasts'

import ProgramEditorView from '../views/ProgramEditorView.vue'

async function mountEditor(router: Router, id: string) {
  const wrapper = mount(ProgramEditorView, {
    props: { id },
    global: { plugins: [router] },
    attachTo: document.body,
  })
  await vi.waitFor(() => expect(wrapper.find('.state--loading').exists()).toBe(false))
  return wrapper
}

function button(wrapper: ReturnType<typeof mount>, label: string) {
  return wrapper.findAll('button').find((node) => node.text() === label)
}

function openDialog(wrapper: ReturnType<typeof mount>) {
  const dialog = wrapper.findAll('dialog').find((node) => node.element.open)
  expect(dialog).toBeDefined()
  return dialog!
}

describe('ProgramEditorView', () => {
  let router: Router

  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/programmes')
    await router.isReady()
  })

  it('ouvre un programme issu d’un modèle avec ses jours et ses prescriptions', async () => {
    const program = await services.programs.createProgram({ title: 'PPL', templateId: 'ppl' })
    const wrapper = await mountEditor(router, program.id)

    const dayNames = wrapper
      .findAll('.editor__day-input')
      .map((node) => (node.element as HTMLInputElement).value)
    expect(dayNames).toEqual(['Push', 'Pull', 'Legs'])
    expect(wrapper.findAll('.prescription')).toHaveLength(15)
    expect(wrapper.get('.prescription__name').text()).toBe('Développé couché')
  })

  it('invite à créer un premier jour sur un programme vide', async () => {
    const program = await services.programs.createProgram({ title: 'Mon plan' })
    const wrapper = await mountEditor(router, program.id)

    expect(wrapper.text()).toContain('Aucun jour dans ce programme')
    await button(wrapper, 'Ajouter un jour')!.trigger('click')
    await vi.waitFor(() =>
      expect((wrapper.get('.editor__day-input').element as HTMLInputElement).value).toBe('Jour 1'),
    )
    expect(wrapper.text()).toContain('Modifications non enregistrées')
  })

  it('ajoute un exercice au jour choisi avec une prescription par défaut', async () => {
    const program = await services.programs.createProgram({ title: 'Mon plan' })
    const wrapper = await mountEditor(router, program.id)
    await button(wrapper, 'Ajouter un jour')!.trigger('click')

    await button(wrapper, 'Ajouter un exercice')!.trigger('click')
    await vi.waitFor(() =>
      expect(openDialog(wrapper).findAll('.exercise-row').length).toBeGreaterThan(0),
    )
    await openDialog(wrapper).get('input[type="search"]').setValue('développé couché')
    await vi.waitFor(() => expect(openDialog(wrapper).findAll('.exercise-row')).toHaveLength(1))
    await openDialog(wrapper).get('.exercise-row').trigger('click')

    await vi.waitFor(() =>
      expect(wrapper.get('.prescription__name').text()).toBe('Développé couché'),
    )
    const [sets, reps, rest] = wrapper.get('.prescription').findAll('input')
    expect((sets!.element as HTMLInputElement).value).toBe('3')
    expect((reps!.element as HTMLInputElement).value).toBe('10')
    expect((rest!.element as HTMLInputElement).value).toBe('120')
  })

  it('enregistre les jours sans créer de version tant que rien n’a servi', async () => {
    const program = await services.programs.createProgram({ title: 'Mon plan' })
    const wrapper = await mountEditor(router, program.id)
    await button(wrapper, 'Ajouter un jour')!.trigger('click')

    await button(wrapper, 'Enregistrer')!.trigger('click')

    await vi.waitFor(async () => {
      const saved = await services.programs.getProgram(program.id)
      expect(saved.currentVersion).toBe(1)
      expect(saved.versions[0]?.days).toHaveLength(1)
    })
    expect(useToastStore().toasts.at(-1)?.message).toBe('Programme enregistré')
    expect(wrapper.text()).not.toContain('Modifications non enregistrées')
  })

  it('annonce et applique la nouvelle version sur un programme déjà utilisé', async () => {
    const program = await services.programs.createProgram({ title: 'Mon plan' })
    await services.programs.saveDays(program.id, [{ id: 'd1', name: 'Jour 1', exercises: [] }])
    await services.programs.markVersionUsed(program.id, 1)

    const wrapper = await mountEditor(router, program.id)
    expect(wrapper.get('.editor__notice').text()).toContain('créera la version 2')

    await button(wrapper, 'Ajouter un jour')!.trigger('click')
    await button(wrapper, 'Enregistrer')!.trigger('click')

    await vi.waitFor(() =>
      expect(useToastStore().toasts.at(-1)?.message).toBe('Programme enregistré en version 2'),
    )
    const saved = await services.programs.getProgram(program.id)
    expect(saved.versions).toHaveLength(2)
    // La version utilisée garde son unique jour
    expect(saved.versions[0]?.days).toHaveLength(1)
    expect(saved.versions[1]?.days).toHaveLength(2)
  })

  it('réordonne les jours au clavier', async () => {
    const program = await services.programs.createProgram({
      title: 'Upper/Lower',
      templateId: 'upper-lower',
    })
    const wrapper = await mountEditor(router, program.id)

    await wrapper.get('[aria-label="Descendre Haut du corps 1"]').trigger('click')

    const names = wrapper
      .findAll('.editor__day-input')
      .map((node) => (node.element as HTMLInputElement).value)
    expect(names.slice(0, 2)).toEqual(['Bas du corps 1', 'Haut du corps 1'])
  })

  it('réordonne les exercices d’un jour', async () => {
    const program = await services.programs.createProgram({ title: 'PPL', templateId: 'ppl' })
    const wrapper = await mountEditor(router, program.id)

    await wrapper.get('[aria-label="Descendre Développé couché"]').trigger('click')

    const names = wrapper.findAll('.prescription__name').map((node) => node.text())
    expect(names.slice(0, 2)).toEqual(['Développé militaire', 'Développé couché'])
  })

  it('supprime un jour vide sans question, un jour rempli après confirmation', async () => {
    const program = await services.programs.createProgram({ title: 'PPL', templateId: 'ppl' })
    const wrapper = await mountEditor(router, program.id)

    await wrapper.get('[aria-label="Supprimer Push"]').trigger('click')
    const dialog = openDialog(wrapper)
    expect(dialog.text()).toContain('Push contient 5 exercices')

    const confirm = dialog.findAll('button').find((node) => node.text() === 'Supprimer')
    await confirm!.trigger('click')
    await vi.waitFor(() => expect(wrapper.findAll('.editor__day-input')).toHaveLength(2))
  })

  it('explique qu’un programme inconnu n’existe pas', async () => {
    const wrapper = await mountEditor(router, 'programme-inexistant')
    expect(wrapper.text()).toContain('Ce programme n’existe pas')
  })
})

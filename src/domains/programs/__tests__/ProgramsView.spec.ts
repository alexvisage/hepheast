import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { routes } from '@/app/router/routes'
import { services } from '@/services'

import ProgramsView from '../views/ProgramsView.vue'

async function mountPrograms(router: Router) {
  const wrapper = mount(ProgramsView, {
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

function dialogButton(wrapper: ReturnType<typeof mount>, label: string) {
  return openDialog(wrapper)
    .findAll('button')
    .find((node) => node.text() === label)!
}

function titles(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('.program__title').map((node) => node.text())
}

describe('ProgramsView', () => {
  let router: Router

  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/programmes')
    await router.isReady()
  })

  it('invite à partir d’un modèle quand la bibliothèque est vide', async () => {
    const wrapper = await mountPrograms(router)
    expect(wrapper.text()).toContain('Aucun programme')
    expect(wrapper.text()).toContain('full body, upper/lower ou PPL')
  })

  it('crée un programme vide', async () => {
    const wrapper = await mountPrograms(router)

    await button(wrapper, 'Créer un programme')!.trigger('click')
    await openDialog(wrapper).get('input[type="text"]').setValue('Prise de masse')
    await dialogButton(wrapper, 'Créer').trigger('click')

    await vi.waitFor(() => expect(titles(wrapper)[0]).toContain('Prise de masse'))
    expect(titles(wrapper)[0]).toContain('Brouillon')
    expect(wrapper.get('.program__meta').text()).toContain('0 jour')
  })

  it('crée un programme depuis un modèle, qui fournit son nom et ses jours', async () => {
    const wrapper = await mountPrograms(router)

    await button(wrapper, 'Créer un programme')!.trigger('click')
    const select = openDialog(wrapper).get('select')
    expect(select.findAll('option').map((option) => option.text())).toEqual([
      'Programme vide',
      'Full body — 2 jours',
      'Upper / Lower — 4 jours',
      'Push / Pull / Legs — 3 jours',
    ])
    await select.setValue('upper-lower')
    await dialogButton(wrapper, 'Créer').trigger('click')

    await vi.waitFor(() => expect(titles(wrapper)[0]).toContain('Upper / Lower'))
    expect(wrapper.get('.program__meta').text()).toContain('4 jours')
  })

  it('refuse un programme sans nom ni modèle', async () => {
    const wrapper = await mountPrograms(router)

    await button(wrapper, 'Créer un programme')!.trigger('click')
    await dialogButton(wrapper, 'Créer').trigger('click')

    expect(openDialog(wrapper).text()).toContain('Donne un nom à ton programme')
    expect(await services.programs.listPrograms()).toHaveLength(0)
  })

  it('mène à l’éditeur du programme', async () => {
    const program = await services.programs.createProgram({ title: 'Plan' })
    const wrapper = await mountPrograms(router)

    const link = wrapper.findAll('a').find((node) => node.text() === 'Modifier')
    expect(link?.attributes('href')).toBe(`/programmes/${program.id}`)
  })

  it('duplique un programme en brouillon', async () => {
    await services.programs.createProgram({ title: 'Plan', templateId: 'full-body' })
    const wrapper = await mountPrograms(router)

    await button(wrapper, 'Dupliquer')!.trigger('click')

    await vi.waitFor(() => expect(titles(wrapper)).toHaveLength(2))
    expect(titles(wrapper).some((title) => title.includes('Plan (copie)'))).toBe(true)
  })

  it('renomme un programme', async () => {
    await services.programs.createProgram({ title: 'Plan' })
    const wrapper = await mountPrograms(router)

    await button(wrapper, 'Renommer')!.trigger('click')
    await openDialog(wrapper).get('input[type="text"]').setValue('Force 5×5')
    await dialogButton(wrapper, 'Renommer').trigger('click')

    await vi.waitFor(() => expect(titles(wrapper)[0]).toContain('Force 5×5'))
  })

  it('archive un programme puis le restaure', async () => {
    await services.programs.createProgram({ title: 'Plan' })
    const wrapper = await mountPrograms(router)

    await button(wrapper, 'Archiver')!.trigger('click')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Tous tes programmes sont archivés.'))

    await wrapper.get('.programs__filter input').setValue(true)
    await vi.waitFor(() => expect(titles(wrapper)[0]).toContain('Archivé'))

    await button(wrapper, 'Restaurer')!.trigger('click')
    await vi.waitFor(() => expect(titles(wrapper)[0]).toContain('Brouillon'))
  })

  it('supprime un programme après confirmation, en conseillant l’archivage', async () => {
    await services.programs.createProgram({ title: 'Plan' })
    const wrapper = await mountPrograms(router)

    await button(wrapper, 'Supprimer')!.trigger('click')
    const dialog = openDialog(wrapper)
    expect(dialog.text()).toContain('Tes séances passées restent intactes')
    expect(dialog.text()).toContain('archive-le plutôt')

    await dialogButton(wrapper, 'Supprimer').trigger('click')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Aucun programme'))
    expect(await services.programs.listPrograms({ includeArchived: true })).toHaveLength(0)
  })
})

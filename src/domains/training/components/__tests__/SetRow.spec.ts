import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import type { SetEntry } from '@/types/domain'

import SetRow from '../SetRow.vue'

function makeSet(overrides: Partial<SetEntry> = {}): SetEntry {
  return {
    id: 'set-1',
    kind: 'working',
    status: 'planned',
    reps: 8,
    load: 80,
    unit: 'kg',
    ...overrides,
  }
}

function mountRow(set: SetEntry = makeSet()) {
  return mount(SetRow, { props: { set, index: 1 } })
}

describe('SetRow', () => {
  it('affiche les répétitions et la charge de la série', () => {
    const wrapper = mountRow()
    const [reps, load] = wrapper.findAll('input')
    expect(reps!.element.value).toBe('8')
    expect(load!.element.value).toBe('80')
    expect(wrapper.get('.set-row__index').text()).toBe('Série 1')
  })

  it('remonte la modification des répétitions et de la charge', async () => {
    const wrapper = mountRow()
    const [reps, load] = wrapper.findAll('input')

    await reps!.setValue('10')
    await reps!.trigger('blur')
    expect(wrapper.emitted('update')?.at(-1)).toEqual([{ reps: 10 }])

    await load!.setValue('82,5')
    await load!.trigger('blur')
    expect(wrapper.emitted('update')?.at(-1)).toEqual([{ load: 82.5 }])
  })

  it('incrémente la charge par pas de 2,5 kg', async () => {
    const wrapper = mountRow()
    const plus = wrapper.get('[aria-label="Augmenter charge série 1 de 2,5"]')
    await plus.trigger('click')
    expect(wrapper.emitted('update')?.at(-1)).toEqual([{ load: 82.5 }])
  })

  it('remonte le changement de type de série', async () => {
    const wrapper = mountRow()
    await wrapper.get('select').setValue('warmup')
    expect(wrapper.emitted('update')?.at(-1)).toEqual([{ kind: 'warmup' }])
  })

  it('reflète le statut validé', async () => {
    const wrapper = mountRow(makeSet({ status: 'done' }))
    const done = wrapper.get('[aria-label="Valider la série 1"]')
    expect(done.attributes('aria-pressed')).toBe('true')
    expect(wrapper.classes()).toContain('set-row--done')

    await done.trigger('click')
    expect(wrapper.emitted('toggleDone')).toHaveLength(1)
  })

  it('reflète le statut ignoré', async () => {
    const wrapper = mountRow(makeSet({ status: 'skipped' }))
    const skip = wrapper.get('[aria-label="Ignorer la série 1"]')
    expect(skip.attributes('aria-pressed')).toBe('true')
    expect(wrapper.classes()).toContain('set-row--skipped')

    await skip.trigger('click')
    expect(wrapper.emitted('toggleSkipped')).toHaveLength(1)
  })

  it('ouvre la note à la demande et remonte sa saisie', async () => {
    const wrapper = mountRow()
    expect(wrapper.find('textarea').exists()).toBe(false)

    await wrapper.get('[aria-label="Note de la série 1"]').trigger('click')
    const note = wrapper.get('textarea')
    await note.setValue('Dos décollé sur la dernière')
    expect(wrapper.emitted('update')?.at(-1)).toEqual([{ note: 'Dos décollé sur la dernière' }])
  })

  it('affiche d’emblée une note déjà saisie', () => {
    const wrapper = mountRow(makeSet({ note: 'Appui instable' }))
    expect(wrapper.get('textarea').element.value).toBe('Appui instable')
  })

  it('retire la note quand elle est vidée', async () => {
    const wrapper = mountRow(makeSet({ note: 'Appui instable' }))
    await wrapper.get('textarea').setValue('   ')
    expect(wrapper.emitted('update')?.at(-1)).toEqual([{ note: undefined }])
  })

  it('demande la suppression de la série', async () => {
    const wrapper = mountRow()
    await wrapper.get('[aria-label="Supprimer la série 1"]').trigger('click')
    expect(wrapper.emitted('remove')).toHaveLength(1)
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'

import { services } from '@/services'

import { useActiveSessionStore } from '../activeSessionStore'
import SessionSummaryView from '../views/SessionSummaryView.vue'

const stubs = { RouterLink: { template: '<a><slot /></a>' } }

/** Joue une séance complète pour que le récapitulatif ait quelque chose à lire */
async function completeSession() {
  const store = useActiveSessionStore()
  await store.start('Push')
  const bench = await services.exercises.getExercise('bench-press')
  const entry = await store.addExercise(bench)
  store.updateSet(entry!.id, entry!.sets[0]!.id, { reps: 8, load: 80 })
  store.toggleSetDone(entry!.id, entry!.sets[0]!.id)
  store.addSet(entry!.id)
  return store.finish({ note: 'Bonne séance', feeling: 4 })
}

describe('SessionSummaryView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('affiche les totaux de la dernière séance terminée', async () => {
    await completeSession()
    const wrapper = mount(SessionSummaryView, { global: { stubs } })
    await vi.waitFor(() => expect(wrapper.find('.recap__stats').exists()).toBe(true))

    const stats = wrapper.findAll('.recap__stat').map((node) => node.text())
    expect(stats).toEqual([
      expect.stringContaining('Durée'),
      'Exercices1',
      'Séries1',
      'Répétitions8',
      'Volume total640 kg',
    ])
  })

  it('détaille chaque exercice et marque les séries non validées', async () => {
    await completeSession()
    const wrapper = mount(SessionSummaryView, { global: { stubs } })
    await vi.waitFor(() => expect(wrapper.find('.recap__exercise').exists()).toBe(true))

    expect(wrapper.get('.recap__exercise-name').text()).toBe('Développé couché')
    expect(wrapper.get('.recap__exercise-meta').text()).toBe('1 série · 640 kg')

    const sets = wrapper.findAll('.recap__set')
    expect(sets).toHaveLength(2)
    expect(sets[1]!.text()).toContain('ignorée')
  })

  it('reprend le ressenti et la note de la séance', async () => {
    await completeSession()
    const wrapper = mount(SessionSummaryView, { global: { stubs } })
    await vi.waitFor(() => expect(wrapper.text()).toContain('Difficile'))
    expect(wrapper.get('.summary__note').text()).toBe('Bonne séance')
  })

  it('propose de démarrer une séance quand l’historique est vide', async () => {
    const wrapper = mount(SessionSummaryView, { global: { stubs } })
    await vi.waitFor(() => expect(wrapper.text()).toContain('Aucune séance terminée'))
  })
})

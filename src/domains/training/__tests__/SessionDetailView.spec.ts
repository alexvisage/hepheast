import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { routes } from '@/app/router/routes'
import { services } from '@/services'

import { useActiveSessionStore } from '../activeSessionStore'
import SessionDetailView from '../views/SessionDetailView.vue'

/**
 * Séance passée : un échauffement, une série de travail notée,
 * une série jamais validée.
 */
async function recordSession() {
  const store = useActiveSessionStore()
  await store.start('Push')
  const bench = await services.exercises.getExercise('bench-press')
  const entry = await store.addExercise(bench)
  const warmup = entry!.sets[0]!

  store.updateSet(entry!.id, warmup.id, { kind: 'warmup', reps: 10, load: 40 })
  store.toggleSetDone(entry!.id, warmup.id)

  store.addSet(entry!.id)
  const working = store.session!.exercises[0]!.sets[1]!
  store.updateSet(entry!.id, working.id, { reps: 8, load: 82.5, note: 'Dos décollé' })
  store.toggleSetDone(entry!.id, working.id)

  store.addSet(entry!.id)
  const completed = await store.finish({ note: 'Bonne séance', feeling: 4 })
  return completed!
}

async function mountDetail(router: Router, id: string) {
  const wrapper = mount(SessionDetailView, { props: { id }, global: { plugins: [router] } })
  await vi.waitFor(() => expect(wrapper.find('.state--loading').exists()).toBe(false))
  return wrapper
}

describe('SessionDetailView', () => {
  let router: Router

  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/')
    await router.isReady()
  })

  it('affiche les valeurs exactes de chaque série, type et note comprises', async () => {
    const session = await recordSession()
    const wrapper = await mountDetail(router, session.id)

    const sets = wrapper.findAll('.recap__set').map((node) => node.text())
    expect(sets[0]).toContain('10 × 40 kg')
    expect(sets[0]).toContain('Échauffement')
    expect(sets[1]).toContain('8 × 82,5 kg')
    expect(sets[1]).toContain('Dos décollé')
    // Une série jamais validée est conservée et marquée
    expect(sets[2]).toContain('ignorée')
  })

  it('résume la séance et rappelle la définition du volume', async () => {
    const session = await recordSession()
    const wrapper = await mountDetail(router, session.id)

    expect(wrapper.get('.recap__stats').text()).toContain('660 kg')
    expect(wrapper.text()).toContain('Volume = somme des charges × répétitions')
  })

  it('reprend le titre, le ressenti et la note de séance', async () => {
    const session = await recordSession()
    const wrapper = await mountDetail(router, session.id)

    expect(wrapper.get('h1').text()).toBe('Push')
    expect(wrapper.text()).toContain('Difficile')
    expect(wrapper.get('.detail__note').text()).toBe('Bonne séance')
  })

  it('explique qu’une séance inconnue n’existe pas', async () => {
    const wrapper = await mountDetail(router, 'seance-inexistante')
    expect(wrapper.text()).toContain('Cette séance n’existe pas')
  })
})

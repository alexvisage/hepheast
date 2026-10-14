import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { routes } from '@/app/router/routes'
import { useActiveSessionStore } from '@/domains/training/activeSessionStore'
import { services } from '@/services'
import { todayKey } from '@/services/dates'
import { useSessionStore } from '@/stores/session'

import DashboardView from '../views/DashboardView.vue'

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

/** Séance terminée aujourd'hui : 8 × 80 kg validés */
async function completeSession() {
  const store = useActiveSessionStore()
  await store.start('Push')
  const bench = await services.exercises.getExercise('bench-press')
  const entry = await store.addExercise(bench)
  store.updateSet(entry!.id, entry!.sets[0]!.id, { reps: 8, load: 80 })
  store.toggleSetDone(entry!.id, entry!.sets[0]!.id)
  await store.finish()
}

async function mountDashboard(router: Router) {
  const wrapper = mount(DashboardView, { global: { plugins: [router] } })
  await vi.waitFor(() => expect(wrapper.find('.state--loading').exists()).toBe(false))
  return wrapper
}

describe('DashboardView', () => {
  let router: Router

  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    signIn()
    router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/')
    await router.isReady()
  })

  it('accueille un nouveau venu avec une invitation à démarrer', async () => {
    const wrapper = await mountDashboard(router)
    expect(wrapper.text()).toContain('Ta première séance t’attend')
    expect(wrapper.text()).not.toContain('Dernière séance')
  })

  it('résume la semaine en cours et la dernière séance', async () => {
    await completeSession()
    const wrapper = await mountDashboard(router)

    const stats = wrapper.findAll('.dashboard__stat').map((node) => node.text())
    expect(stats).toEqual(['Séances1', 'Séries1', 'Volume640 kg', expect.stringContaining('Temps')])
    expect(wrapper.text()).toContain('Dernière séance')
    expect(wrapper.text()).toContain('1 série · 8 répétitions · 640 kg')
  })

  it('marque le jour de la séance dans la semaine', async () => {
    await completeSession()
    const wrapper = await mountDashboard(router)

    const done = wrapper.findAll('.dashboard__dot--done')
    expect(done).toHaveLength(1)
    expect(wrapper.findAll('.dashboard__day')).toHaveLength(7)
  })

  it('propose de démarrer la prochaine séance planifiée', async () => {
    await services.schedule.createScheduled({ date: todayKey('Europe/Paris'), title: 'Jambes' })
    const wrapper = await mountDashboard(router)
    expect(wrapper.text()).toContain('Prochaine séance')
    expect(wrapper.text()).toContain('Jambes')

    const start = wrapper.findAll('button').find((button) => button.text() === 'Démarrer')
    await start!.trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('active-session'))

    // Le créneau est rattaché à la séance démarrée
    const active = useActiveSessionStore()
    const scheduled = await services.schedule.listScheduled({
      from: todayKey('Europe/Paris'),
      to: todayKey('Europe/Paris'),
    })
    expect(scheduled[0]?.sessionId).toBe(active.session?.id)
    expect(scheduled[0]?.status).toBe('done')
    await active.flush()
  })

  it('met la reprise de séance avant tout le reste', async () => {
    const store = useActiveSessionStore()
    await store.start('Haut du corps')
    const wrapper = await mountDashboard(router)

    expect(wrapper.text()).toContain('Séance en cours')
    expect(wrapper.text()).toContain('Reprendre la séance')
    expect(wrapper.text()).not.toContain('Prochaine séance')
    await store.flush()
  })

  it('offre les raccourcis vers l’entraînement, les favoris et le calendrier', async () => {
    const wrapper = await mountDashboard(router)
    const links = wrapper.findAll('.shortcut').map((node) => node.attributes('href'))
    expect(links).toEqual(['/entrainement', '/exercices?favoris=1', '/calendrier'])
  })
})

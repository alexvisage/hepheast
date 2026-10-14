import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { routes } from '@/app/router/routes'
import { useActiveSessionStore } from '@/domains/training/activeSessionStore'
import { services } from '@/services'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@/stores/toasts'

import CalendarView from '../views/CalendarView.vue'

/** Démarrer ou consulter une séance depuis le calendrier (SCRUM-166) */
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

describe('actions du calendrier', () => {
  let router: Router

  beforeEach(async () => {
    localStorage.clear()
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-14T10:00:00.000Z') })
    setActivePinia(createPinia())
    signIn()
    router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/calendrier')
    await router.isReady()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function mountCalendar() {
    const wrapper = mount(CalendarView, { global: { plugins: [router] } })
    await vi.waitFor(() => expect(wrapper.find('.cell').exists()).toBe(true))
    return wrapper
  }

  function button(wrapper: ReturnType<typeof mount>, label: string) {
    return wrapper.findAll('button').find((node) => node.text() === label)
  }

  it('démarre la séance du jour et la rattache à son créneau', async () => {
    const plan = await services.schedule.createScheduled({ date: '2026-10-14', title: 'Push' })
    const wrapper = await mountCalendar()
    await vi.waitFor(() => expect(button(wrapper, 'Démarrer')).toBeDefined())

    await button(wrapper, 'Démarrer')!.trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('active-session'))

    const active = useActiveSessionStore()
    expect(active.session?.title).toBe('Push')
    const [updated] = await services.schedule.listScheduled({
      from: '2026-10-14',
      to: '2026-10-14',
    })
    expect(updated).toMatchObject({ id: plan.id, sessionId: active.session?.id, status: 'done' })
    await active.flush()
  })

  it('renvoie vers la séance en cours plutôt que d’en ouvrir une seconde', async () => {
    await services.schedule.createScheduled({ date: '2026-10-14', title: 'Push' })
    const active = useActiveSessionStore()
    await active.start('Déjà commencée')

    const wrapper = await mountCalendar()
    await vi.waitFor(() => expect(button(wrapper, 'Démarrer')).toBeDefined())
    await button(wrapper, 'Démarrer')!.trigger('click')

    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('active-session'))
    expect(active.session?.title).toBe('Déjà commencée')
    expect(useToastStore().toasts.at(-1)?.message).toBe('Une séance est déjà en cours.')
    await active.flush()
  })

  it('ouvre le détail d’une séance déjà réalisée', async () => {
    const store = useActiveSessionStore()
    await store.start('Push')
    const started = store.session!.id
    const completed = await store.finish()
    const plan = await services.schedule.createScheduled({ date: '2026-10-14', title: 'Push' })
    await services.schedule.linkSession(plan.id, completed!.id)

    const wrapper = await mountCalendar()
    await vi.waitFor(() => {
      const link = wrapper.findAll('a').find((node) => node.text() === 'Voir le détail')
      expect(link?.attributes('href')).toBe(`/historique/${started}`)
    })
    expect(button(wrapper, 'Démarrer')).toBeUndefined()
  })

  it('permet encore de démarrer une séance manquée', async () => {
    await services.schedule.createScheduled({ date: '2026-10-12', title: 'Oubliée' })
    const wrapper = await mountCalendar()

    const cell = wrapper
      .findAll('.cell')
      .find((node) => node.attributes('aria-label')?.includes('12 octobre'))!
    await cell.trigger('click')

    await vi.waitFor(() => expect(wrapper.get('.day__status').text()).toBe('Manquée'))
    expect(button(wrapper, 'Démarrer')).toBeDefined()
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { routes } from '@/app/router/routes'

import { services } from '@/services'
import { useSessionStore } from '@/stores/session'

import CalendarView from '../views/CalendarView.vue'

/** Planifier, déplacer et annuler depuis le calendrier (SCRUM-165) */
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

let router: Router

async function mountCalendar() {
  const wrapper = mount(CalendarView, { global: { plugins: [router] }, attachTo: document.body })
  await vi.waitFor(() => expect(wrapper.find('.cell').exists()).toBe(true))
  return wrapper
}

function button(wrapper: ReturnType<typeof mount>, label: string) {
  return wrapper.findAll('button').find((node) => node.text() === label)
}

/** Les dialogues reprennent les mêmes libellés que la page : on cible l'ouvert */
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

async function listPlans() {
  return services.schedule.listScheduled({ from: '2026-09-01', to: '2026-12-31' })
}

describe('planification depuis le calendrier', () => {
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

  it('planifie une séance au jour choisi', async () => {
    const wrapper = await mountCalendar()

    await button(wrapper, 'Planifier')!.trigger('click')
    await openDialog(wrapper).get('input[type="date"]').setValue('2026-10-20')
    await openDialog(wrapper).get('input[type="text"]').setValue('Jambes')
    await dialogButton(wrapper, 'Planifier').trigger('click')

    await vi.waitFor(async () => {
      const plans = await listPlans()
      expect(plans).toHaveLength(1)
      expect(plans[0]).toMatchObject({ date: '2026-10-20', title: 'Jambes', status: 'planned' })
    })
    // Le jour planifié devient le jour affiché
    await vi.waitFor(() => expect(wrapper.get('.day__title').text()).toBe('Jambes'))
  })

  it('nomme « Séance » un créneau sans titre', async () => {
    const wrapper = await mountCalendar()

    await button(wrapper, 'Planifier')!.trigger('click')
    await dialogButton(wrapper, 'Planifier').trigger('click')

    await vi.waitFor(async () => expect((await listPlans())[0]?.title).toBe('Séance'))
  })

  it('reporte une séance d’un jour et garde le jour d’origine', async () => {
    await services.schedule.createScheduled({ date: '2026-10-14', title: 'Push' })
    const wrapper = await mountCalendar()
    await vi.waitFor(() => expect(wrapper.get('.day__title').text()).toBe('Push'))

    await wrapper.get('[aria-label="Reporter Push d’un jour"]').trigger('click')

    await vi.waitFor(async () => {
      const [plan] = await listPlans()
      expect(plan).toMatchObject({ date: '2026-10-15', status: 'moved', movedFrom: '2026-10-14' })
    })
    await vi.waitFor(() =>
      expect(wrapper.get('.day__status').text()).toContain('déplacée du mercredi 14 octobre'),
    )
  })

  it('déplace une séance à une date précise', async () => {
    await services.schedule.createScheduled({ date: '2026-10-14', title: 'Push' })
    const wrapper = await mountCalendar()
    await vi.waitFor(() => expect(wrapper.get('.day__title').text()).toBe('Push'))

    await button(wrapper, 'Déplacer')!.trigger('click')
    await openDialog(wrapper).get('input[type="date"]').setValue('2026-10-22')
    await dialogButton(wrapper, 'Déplacer').trigger('click')

    await vi.waitFor(async () => expect((await listPlans())[0]?.date).toBe('2026-10-22'))
  })

  it('annule une séance planifiée après confirmation', async () => {
    await services.schedule.createScheduled({ date: '2026-10-14', title: 'Push' })
    const wrapper = await mountCalendar()
    await vi.waitFor(() => expect(wrapper.get('.day__title').text()).toBe('Push'))

    await button(wrapper, 'Annuler')!.trigger('click')
    expect(openDialog(wrapper).text()).toContain('Push disparaîtra du calendrier')

    await dialogButton(wrapper, 'Garder').trigger('click')
    expect(await listPlans()).toHaveLength(1)

    await button(wrapper, 'Annuler')!.trigger('click')
    await dialogButton(wrapper, 'Annuler la séance').trigger('click')
    await vi.waitFor(async () => expect(await listPlans()).toHaveLength(0))
  })

  it('n’offre ni déplacement ni annulation sur une séance déjà faite', async () => {
    const plan = await services.schedule.createScheduled({ date: '2026-10-14', title: 'Push' })
    await services.schedule.linkSession(plan.id, 'session-1')

    const wrapper = await mountCalendar()
    await vi.waitFor(() => expect(wrapper.get('.day__status').text()).toBe('Terminée'))
    expect(button(wrapper, 'Déplacer')).toBeUndefined()
    expect(wrapper.get('.day__actions').text()).not.toContain('Annuler')
  })
})

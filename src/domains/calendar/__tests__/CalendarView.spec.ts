import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'

import { services } from '@/services'
import { useSessionStore } from '@/stores/session'
import type { WeekStart } from '@/services/dates'

import CalendarView from '../views/CalendarView.vue'

function signIn(weekStartsOn: WeekStart = 1) {
  useSessionStore().user = {
    id: 'anonymous',
    email: 'alex@example.com',
    displayName: 'Alex',
    preferences: {
      unit: 'kg',
      weekStartsOn,
      timeZone: 'Europe/Paris',
      defaultRestSeconds: 120,
      autoRest: true,
    },
  }
}

async function mountCalendar() {
  const wrapper = mount(CalendarView)
  await vi.waitFor(() => expect(wrapper.find('.cell').exists()).toBe(true))
  return wrapper
}

function mode(wrapper: ReturnType<typeof mount>, label: string) {
  return wrapper.findAll('.mode').find((node) => node.text() === label)!
}

describe('CalendarView', () => {
  beforeEach(() => {
    localStorage.clear()
    // Seul Date est simulé : les latences des services restent réelles
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-14T10:00:00.000Z') })
    setActivePinia(createPinia())
    signIn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ouvre le mois en cours, semaines commençant le lundi', async () => {
    const wrapper = await mountCalendar()

    expect(wrapper.get('.calendar__range').text()).toBe('octobre 2026')
    expect(wrapper.get('.grid__weekday').text()).toBe('lun.')
    // Les semaines entières encadrant octobre 2026 : 35 jours
    expect(wrapper.findAll('.cell')).toHaveLength(35)
    expect(wrapper.findAll('.cell--today')).toHaveLength(1)
  })

  it('suit la préférence de premier jour de semaine', async () => {
    signIn(0)
    const wrapper = await mountCalendar()
    expect(wrapper.get('.grid__weekday').text()).toBe('dim.')
  })

  it('navigue d’un mois à l’autre et revient à aujourd’hui', async () => {
    const wrapper = await mountCalendar()

    await wrapper.get('[aria-label="Période suivante"]').trigger('click')
    await vi.waitFor(() => expect(wrapper.get('.calendar__range').text()).toBe('novembre 2026'))

    await wrapper.get('[aria-label="Période précédente"]').trigger('click')
    await wrapper.get('[aria-label="Période précédente"]').trigger('click')
    await vi.waitFor(() => expect(wrapper.get('.calendar__range').text()).toBe('septembre 2026'))

    const todayButton = wrapper.findAll('button').find((node) => node.text() === 'Aujourd’hui')!
    await todayButton.trigger('click')
    await vi.waitFor(() => expect(wrapper.get('.calendar__range').text()).toBe('octobre 2026'))
  })

  it('passe en vue semaine puis en vue jour', async () => {
    const wrapper = await mountCalendar()

    await mode(wrapper, 'Semaine').trigger('click')
    await vi.waitFor(() => expect(wrapper.findAll('.cell')).toHaveLength(7))
    expect(wrapper.get('.calendar__range').text()).toBe('du 12 au 18 octobre')

    await mode(wrapper, 'Jour').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('.cell').exists()).toBe(false))
    expect(wrapper.get('.calendar__range').text()).toBe('mercredi 14 octobre 2026')
  })

  it('affiche les statuts avec une icône et un libellé', async () => {
    await services.schedule.createScheduled({ date: '2026-10-16', title: 'Jambes' })
    await services.schedule.createScheduled({ date: '2026-10-09', title: 'Oubliée' })

    const wrapper = await mountCalendar()
    const legend = wrapper.findAll('.legend__item').map((node) => node.text())
    expect(legend).toEqual(['Planifiée', 'Terminée', 'Manquée', 'Déplacée'])

    // Le jour choisi détaille ses entrées
    const cellOf = (day: string) =>
      wrapper.findAll('.cell').find((cell) => cell.attributes('aria-label')?.includes(day))!
    await vi.waitFor(() =>
      expect(cellOf('16 octobre').attributes('aria-label')).toContain('Jambes, planifiée'),
    )
    await cellOf('16 octobre').trigger('click')
    await vi.waitFor(() => expect(wrapper.get('.day__title').text()).toBe('Jambes'))
    expect(wrapper.get('.day__status').text()).toBe('Planifiée')

    expect(cellOf('9 octobre').attributes('aria-label')).toContain('Oubliée, manquée')
  })

  it('annonce un jour sans rien de prévu', async () => {
    const wrapper = await mountCalendar()
    const cell = wrapper
      .findAll('.cell')
      .find((node) => node.attributes('aria-label')?.includes('20 octobre'))!
    expect(cell.attributes('aria-label')).toContain('rien de prévu')

    await cell.trigger('click')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Rien de prévu ce jour-là.'))
  })

  it('résume la semaine affichée', async () => {
    const wrapper = await mountCalendar()
    const stats = wrapper.findAll('.calendar__stat').map((node) => node.text())
    expect(stats).toEqual(['Séances0', 'Volume0 kg', 'Régularité0 sem.'])
  })
})

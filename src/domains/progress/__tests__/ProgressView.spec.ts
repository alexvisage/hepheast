import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { routes } from '@/app/router/routes'
import { services } from '@/services'
import { addDays, todayKey } from '@/services/dates'
import { useSessionStore } from '@/stores/session'
import type { SetEntry, WorkoutSession } from '@/types/domain'

import ProgressView from '../views/ProgressView.vue'

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

function set(overrides: Partial<SetEntry> = {}): SetEntry {
  return {
    id: crypto.randomUUID(),
    kind: 'working',
    status: 'done',
    reps: 8,
    load: 80,
    unit: 'kg',
    ...overrides,
  }
}

/** Séance terminée sur un exercice, datée du jour donné */
async function record(day: string, sets: SetEntry[], exerciseId = 'bench-press') {
  const session: WorkoutSession = {
    id: crypto.randomUUID(),
    userId: 'anonymous',
    title: 'Push',
    status: 'completed',
    startedAt: `${day}T12:00:00.000Z`,
    endedAt: `${day}T13:00:00.000Z`,
    exercises: [{ id: crypto.randomUUID(), exerciseId, sets }],
  }
  await services.workouts.saveSession(session)
}

describe('ProgressView', () => {
  let router: Router
  const today = todayKey('Europe/Paris')

  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    signIn()
    router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/progression')
    await router.isReady()
  })

  async function mountProgress() {
    const wrapper = mount(ProgressView, { global: { plugins: [router] }, attachTo: document.body })
    await vi.waitFor(() => expect(wrapper.find('.state--loading').exists()).toBe(false))
    return wrapper
  }

  it('ouvre sur un exercice déjà travaillé et trace sa courbe', async () => {
    await record(addDays(today, -7), [set({ reps: 8, load: 75 })])
    await record(today, [set({ reps: 8, load: 80 })])

    const wrapper = await mountProgress()
    expect(wrapper.text()).toContain('Charge max — Développé couché')
    expect(wrapper.get('.chart').element.querySelector('svg')).not.toBeNull()
  })

  it('double la courbe d’un tableau équivalent', async () => {
    await record(today, [set({ reps: 8, load: 80 })])
    const wrapper = await mountProgress()

    const headers = wrapper.findAll('thead th').map((node) => node.text())
    expect(headers).toEqual(['Séance', 'Meilleure série', 'Charge max', 'Volume', '1RM estimé'])

    const row = wrapper.findAll('tbody td').map((node) => node.text())
    expect(row).toEqual(['8 × 80 kg', '80 kg', '640 kg', '101,3 kg'])
    // Le graphique lui-même reste hors de l'arbre d'accessibilité
    expect(wrapper.get('.chart').attributes('aria-hidden')).toBe('true')
  })

  it('libelle l’estimation et donne sa formule', async () => {
    await record(today, [set()])
    const wrapper = await mountProgress()
    expect(wrapper.text()).toContain('1RM estimé')
    expect(wrapper.text()).toContain('charge × (1 + répétitions ÷ 30)')
    expect(wrapper.text()).toContain('formule d’Epley')
  })

  it('affiche la progression entre la première et la dernière séance', async () => {
    await record(addDays(today, -7), [set({ reps: 8, load: 75 })])
    await record(today, [set({ reps: 8, load: 80 })])

    const wrapper = await mountProgress()
    expect(wrapper.get('.progress__trend').text()).toContain('+5 kg')
    expect(wrapper.get('.progress__trend').text()).toContain('+7 %')
    expect(wrapper.get('.progress__best').text()).toBe('Record de la période : 80 kg')
  })

  it('change de mesure sans recharger les données', async () => {
    await record(today, [set({ reps: 8, load: 80 })])
    const wrapper = await mountProgress()

    const metric = wrapper
      .findAll('.select')
      .find((node) => node.text().startsWith('Mesure'))!
      .find('select')
    await metric.setValue('oneRepMax')
    await vi.waitFor(() => expect(wrapper.text()).toContain('1RM estimé — Développé couché'))
  })

  it('restreint la période demandée', async () => {
    await record(addDays(today, -40), [set({ reps: 8, load: 70 })])
    await record(today, [set({ reps: 8, load: 80 })])

    const wrapper = await mountProgress()
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)

    const period = wrapper
      .findAll('.select')
      .find((node) => node.text().startsWith('Période'))!
      .find('select')
    await period.setValue('7')
    await vi.waitFor(() => expect(wrapper.findAll('tbody tr')).toHaveLength(1))
  })

  it('explique l’absence de données sur un exercice jamais réalisé', async () => {
    const wrapper = await mountProgress()
    expect(wrapper.text()).toContain('Pas encore de données')
  })
})

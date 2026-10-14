import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { routes } from '@/app/router/routes'
import { services } from '@/services'
import { addDays, todayKey } from '@/services/dates'
import type { SetEntry, WorkoutSession, WorkoutStatus } from '@/types/domain'

import HistoryView from '../views/HistoryView.vue'

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

/** Enregistre une séance achevée, datée du jour donné à midi */
async function record(options: {
  day: string
  title: string
  exerciseId?: string
  status?: WorkoutStatus
}) {
  const startedAt = `${options.day}T12:00:00.000Z`
  const session: WorkoutSession = {
    id: crypto.randomUUID(),
    userId: 'anonymous',
    title: options.title,
    status: options.status ?? 'completed',
    startedAt,
    endedAt: `${options.day}T13:00:00.000Z`,
    exercises: [
      {
        id: crypto.randomUUID(),
        exerciseId: options.exerciseId ?? 'bench-press',
        sets: [set()],
      },
    ],
  }
  await services.workouts.saveSession(session)
  return session
}

async function mountHistory(router: Router) {
  const wrapper = mount(HistoryView, { global: { plugins: [router] } })
  await vi.waitFor(() => expect(wrapper.find('.state--loading').exists()).toBe(false))
  return wrapper
}

function titles(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('.history__title').map((node) => node.text())
}

/** Change un filtre ; l'appelant attend ensuite le résultat avec `vi.waitFor` */
async function choose(wrapper: ReturnType<typeof mount>, label: string, value: string) {
  const select = wrapper
    .findAll('.select')
    .find((node) => node.text().startsWith(label))!
    .find('select')
  await select.setValue(value)
}

describe('HistoryView', () => {
  let router: Router
  const today = todayKey()

  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/historique')
    await router.isReady()
  })

  it('liste les séances de la plus récente à la plus ancienne', async () => {
    await record({ day: addDays(today, -1), title: 'Hier' })
    await record({ day: today, title: 'Aujourd’hui' })
    await record({ day: addDays(today, -3), title: 'Avant-hier' })

    const wrapper = await mountHistory(router)
    expect(titles(wrapper)).toEqual(['Aujourd’hui', 'Hier', 'Avant-hier'])
  })

  it('montre durée, séries et volume de chaque séance', async () => {
    await record({ day: today, title: 'Push' })
    const wrapper = await mountHistory(router)
    expect(wrapper.get('.history__meta').text()).toContain('1 h 00 · 1 série · 640 kg')
  })

  it('signale une séance abandonnée', async () => {
    await record({ day: today, title: 'Interrompue', status: 'abandoned' })
    const wrapper = await mountHistory(router)
    expect(wrapper.get('.history__badge').text()).toBe('abandonnée')
  })

  it('ouvre le détail d’une séance', async () => {
    const session = await record({ day: today, title: 'Push' })
    const wrapper = await mountHistory(router)
    expect(wrapper.get('.history__row').attributes('href')).toBe(`/historique/${session.id}`)
  })

  it('filtre par exercice', async () => {
    await record({ day: today, title: 'Pectoraux', exerciseId: 'bench-press' })
    await record({ day: today, title: 'Jambes', exerciseId: 'back-squat' })

    const wrapper = await mountHistory(router)
    expect(titles(wrapper)).toHaveLength(2)

    await choose(wrapper, 'Exercice', 'back-squat')
    await vi.waitFor(() => expect(titles(wrapper)).toEqual(['Jambes']))
  })

  it('filtre par muscle', async () => {
    await record({ day: today, title: 'Pectoraux', exerciseId: 'bench-press' })
    await record({ day: today, title: 'Jambes', exerciseId: 'back-squat' })

    const wrapper = await mountHistory(router)
    await choose(wrapper, 'Muscle', 'quads')
    await vi.waitFor(() => expect(titles(wrapper)).toEqual(['Jambes']))
  })

  it('filtre par période', async () => {
    await record({ day: today, title: 'Récente' })
    await record({ day: addDays(today, -40), title: 'Ancienne' })

    const wrapper = await mountHistory(router)
    expect(titles(wrapper)).toEqual(['Récente', 'Ancienne'])

    await choose(wrapper, 'Période', '7')
    await vi.waitFor(() => expect(titles(wrapper)).toEqual(['Récente']))
  })

  it('charge les séances plus anciennes à la demande', async () => {
    for (let index = 0; index < 12; index += 1) {
      await record({ day: addDays(today, -index), title: `Séance ${index}` })
    }

    const wrapper = await mountHistory(router)
    expect(titles(wrapper)).toHaveLength(10)

    const more = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Charger les séances précédentes')
    await more!.trigger('click')
    await vi.waitFor(() => expect(titles(wrapper)).toHaveLength(12))

    // Plus rien à charger : le bouton disparaît
    expect(wrapper.findAll('button').some((button) => button.text().includes('Charger'))).toBe(
      false,
    )
  })

  it('propose d’effacer les filtres quand la sélection est vide', async () => {
    await record({ day: addDays(today, -40), title: 'Ancienne' })
    const wrapper = await mountHistory(router)

    await choose(wrapper, 'Période', '7')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Aucune séance sur cette sélection'))

    const clear = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Effacer les filtres')
    await clear!.trigger('click')
    await vi.waitFor(() => expect(titles(wrapper)).toEqual(['Ancienne']))
  })

  it('invite à démarrer une séance quand l’historique est vide', async () => {
    const wrapper = await mountHistory(router)
    expect(wrapper.text()).toContain('Aucune séance enregistrée')
  })
})

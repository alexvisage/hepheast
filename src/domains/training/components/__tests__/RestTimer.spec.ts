import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'

import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@/stores/toasts'

import { useRestTimerStore } from '../../restTimerStore'
import RestTimer from '../RestTimer.vue'

vi.mock('../../restSignal', () => ({ signalRestEnd: vi.fn<() => void>() }))

function signIn(autoRest = true) {
  useSessionStore().user = {
    id: 'u1',
    email: 'alex@example.com',
    displayName: 'Alex',
    preferences: {
      unit: 'kg',
      weekStartsOn: 1,
      timeZone: 'Europe/Paris',
      defaultRestSeconds: 120,
      autoRest,
    },
  }
}

describe('RestTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    signIn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('propose de lancer le repos par défaut au repos inactif', async () => {
    const wrapper = mount(RestTimer)
    const start = wrapper.findAll('button').find((button) => button.text().includes('Repos 2:00'))
    expect(start).toBeDefined()

    await start!.trigger('click')
    expect(useRestTimerStore().isRunning).toBe(true)
  })

  it('affiche le décompte et les ajustements pendant le repos', async () => {
    const rest = useRestTimerStore()
    const wrapper = mount(RestTimer)
    rest.start(60)
    await vi.advanceTimersByTimeAsync(10_000)

    expect(wrapper.get('.rest__clock').text()).toBe('0:50')

    const plus = wrapper.findAll('button').find((button) => button.text() === '+15 s')
    await plus!.trigger('click')
    expect(wrapper.get('.rest__clock').text()).toBe('1:05')
  })

  it('met en pause puis reprend', async () => {
    const rest = useRestTimerStore()
    const wrapper = mount(RestTimer)
    rest.start(60)
    await vi.advanceTimersByTimeAsync(0)

    await wrapper.get('[aria-label="Mettre le repos en pause"]').trigger('click')
    expect(rest.isPaused).toBe(true)

    await wrapper.get('[aria-label="Reprendre le repos"]').trigger('click')
    expect(rest.isRunning).toBe(true)
  })

  it('annonce la fin du repos', async () => {
    const rest = useRestTimerStore()
    const wrapper = mount(RestTimer)
    rest.start(30)
    await vi.advanceTimersByTimeAsync(30_000)

    expect(wrapper.get('.rest__clock').text()).toBe('Repos terminé')
    expect(wrapper.get('[role="status"]').text()).toBe('Repos terminé')

    await wrapper.get('[aria-label="Masquer le repos terminé"]').trigger('click')
    expect(rest.finished).toBe(false)
  })

  it('propose de garder la durée ajustée comme repos par défaut', async () => {
    const rest = useRestTimerStore()
    const wrapper = mount(RestTimer)
    rest.start(120)
    await vi.advanceTimersByTimeAsync(0)
    expect(wrapper.find('.rest__default').exists()).toBe(false)

    rest.adjust(15)
    await vi.advanceTimersByTimeAsync(0)
    expect(wrapper.get('.rest__default').text()).toBe('Garder 2:15 comme repos par défaut')
  })

  it('laisse désactiver le démarrage automatique', async () => {
    const update = vi.spyOn(useSessionStore(), 'updatePreferences').mockResolvedValue(undefined)
    const wrapper = mount(RestTimer)
    const checkbox = wrapper.get('input[type="checkbox"]')
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)

    await checkbox.setValue(false)
    expect(update).toHaveBeenCalledWith({ autoRest: false })
  })

  it('signale l’échec d’enregistrement d’une préférence', async () => {
    vi.spyOn(useSessionStore(), 'updatePreferences').mockRejectedValue(new Error('offline'))
    const toasts = useToastStore()
    const wrapper = mount(RestTimer)

    await wrapper.get('input[type="checkbox"]').setValue(false)
    await vi.advanceTimersByTimeAsync(0)
    expect(toasts.toasts.at(-1)?.message).toBe('La préférence n’a pas pu être enregistrée.')
  })
})

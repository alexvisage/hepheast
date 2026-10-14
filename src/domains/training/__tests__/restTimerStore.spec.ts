import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useSessionStore } from '@/stores/session'
import type { UserProfile } from '@/types/domain'

import { signalRestEnd } from '../restSignal'
import { FALLBACK_REST_SECONDS, useRestTimerStore } from '../restTimerStore'

vi.mock('../restSignal', () => ({ signalRestEnd: vi.fn<() => void>() }))

function signIn(preferences: Partial<UserProfile['preferences']> = {}) {
  useSessionStore().user = {
    id: 'u1',
    email: 'alex@example.com',
    displayName: 'Alex',
    preferences: {
      unit: 'kg',
      weekStartsOn: 1,
      timeZone: 'Europe/Paris',
      defaultRestSeconds: 120,
      autoRest: true,
      ...preferences,
    },
  }
}

describe('minuteur de repos', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(signalRestEnd).mockClear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('décompte depuis la durée par défaut de l’utilisateur', () => {
    signIn()
    const rest = useRestTimerStore()
    rest.start()
    expect(rest.isRunning).toBe(true)
    expect(rest.remainingSeconds).toBe(120)

    vi.advanceTimersByTime(30_000)
    expect(rest.remainingSeconds).toBe(90)
  })

  it('se replie sur 90 s sans préférence enregistrée', () => {
    const rest = useRestTimerStore()
    rest.start()
    expect(rest.remainingSeconds).toBe(FALLBACK_REST_SECONDS)
  })

  it('ajuste le repos en cours de ±15 s', () => {
    signIn({ defaultRestSeconds: 60 })
    const rest = useRestTimerStore()
    rest.start()

    rest.adjust(15)
    expect(rest.remainingSeconds).toBe(75)
    rest.adjust(-15)
    expect(rest.remainingSeconds).toBe(60)
  })

  it('met en pause puis reprend sans perdre le temps restant', () => {
    signIn({ defaultRestSeconds: 60 })
    const rest = useRestTimerStore()
    rest.start()
    vi.advanceTimersByTime(20_000)

    rest.pause()
    expect(rest.isPaused).toBe(true)
    expect(rest.remainingSeconds).toBe(40)

    // Le temps passé en pause ne compte pas
    vi.advanceTimersByTime(10_000)
    expect(rest.remainingSeconds).toBe(40)

    rest.resume()
    vi.advanceTimersByTime(5_000)
    expect(rest.remainingSeconds).toBe(35)
  })

  it('signale la fin du repos une seule fois', () => {
    signIn({ defaultRestSeconds: 30 })
    const rest = useRestTimerStore()
    rest.start()

    vi.advanceTimersByTime(30_000)
    expect(rest.finished).toBe(true)
    expect(rest.isActive).toBe(false)
    expect(signalRestEnd).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(10_000)
    expect(signalRestEnd).toHaveBeenCalledTimes(1)
  })

  it('n’émet aucun signal quand l’utilisateur arrête le repos', () => {
    signIn()
    const rest = useRestTimerStore()
    rest.start()
    rest.stop()

    vi.advanceTimersByTime(300_000)
    expect(rest.isActive).toBe(false)
    expect(rest.finished).toBe(false)
    expect(signalRestEnd).not.toHaveBeenCalled()
  })

  it('ne démarre pas automatiquement si la préférence est désactivée', () => {
    signIn({ autoRest: false })
    const rest = useRestTimerStore()
    expect(rest.startIfAuto()).toBe(false)
    expect(rest.isActive).toBe(false)

    // Le démarrage manuel reste possible
    rest.start()
    expect(rest.isRunning).toBe(true)
  })

  it('démarre automatiquement par défaut', () => {
    signIn()
    const rest = useRestTimerStore()
    expect(rest.startIfAuto()).toBe(true)
    expect(rest.isRunning).toBe(true)
  })
})

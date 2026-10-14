import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useToastStore } from '../toasts'

describe('toasts', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ajoute une notification puis la retire automatiquement', () => {
    const store = useToastStore()
    store.show('Séance enregistrée', 'success', 3000)
    expect(store.toasts).toHaveLength(1)
    expect(store.toasts[0]).toMatchObject({ message: 'Séance enregistrée', tone: 'success' })
    vi.advanceTimersByTime(3000)
    expect(store.toasts).toHaveLength(0)
  })

  it('garde une notification persistante jusqu’à sa fermeture', () => {
    const store = useToastStore()
    const id = store.show('Hors ligne', 'warning', 0)
    vi.advanceTimersByTime(60_000)
    expect(store.toasts).toHaveLength(1)
    store.dismiss(id)
    expect(store.toasts).toHaveLength(0)
  })
})

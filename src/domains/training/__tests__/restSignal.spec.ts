import { afterEach, describe, expect, it, vi } from 'vitest'

import { signalRestEnd } from '../restSignal'

/** jsdom n'implémente ni la vibration ni l'audio : on les ajoute à la demande */
function stubVibrate(implementation: () => boolean) {
  Object.defineProperty(navigator, 'vibrate', {
    value: vi.fn<() => boolean>(implementation),
    configurable: true,
    writable: true,
  })
  return navigator.vibrate as unknown as ReturnType<typeof vi.fn>
}

describe('signal de fin de repos', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'vibrate')
  })

  it('fait vibrer l’appareil quand c’est possible', () => {
    const vibrate = stubVibrate(() => true)
    signalRestEnd()
    expect(vibrate).toHaveBeenCalledOnce()
  })

  it('reste silencieux si la vibration et l’audio sont indisponibles', () => {
    expect('vibrate' in navigator).toBe(false)
    expect(() => signalRestEnd()).not.toThrow()
  })

  it('ignore une vibration refusée par l’appareil', () => {
    stubVibrate(() => {
      throw new Error('refusé')
    })
    expect(() => signalRestEnd()).not.toThrow()
  })
})

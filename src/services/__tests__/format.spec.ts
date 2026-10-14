import { describe, expect, it } from 'vitest'

import { formatClock, formatDuration, formatLoad, formatSet } from '../format'

describe('formatage', () => {
  it('affiche les charges à la française', () => {
    expect(formatLoad(62.5, 'kg')).toBe('62,5 kg')
    expect(formatLoad(null, 'kg')).toBe('—')
  })

  it('résume une série avec ou sans charge', () => {
    expect(formatSet(8, 100, 'kg')).toBe('8 × 100 kg')
    expect(formatSet(12, null, 'kg')).toBe('12 rép.')
  })

  it('formate les durées de séance et le minuteur', () => {
    expect(formatDuration(42 * 60)).toBe('42 min')
    expect(formatDuration(65 * 60)).toBe('1 h 05')
    expect(formatClock(90)).toBe('1:30')
    expect(formatClock(-3)).toBe('0:00')
  })
})

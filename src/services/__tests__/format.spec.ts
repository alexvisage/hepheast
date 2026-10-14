import { describe, expect, it } from 'vitest'

import {
  formatClock,
  formatDuration,
  formatLoad,
  formatSet,
  formatShortDate,
  formatTime,
} from '../format'

describe('formatage', () => {
  it('affiche les charges à la française', () => {
    expect(formatLoad(62.5, 'kg')).toBe('62,5 kg')
    expect(formatLoad(null, 'kg')).toBe('—')
  })

  it('résume une série avec ou sans charge', () => {
    expect(formatSet(8, 100, 'kg')).toBe('8 × 100 kg')
    expect(formatSet(12, null, 'kg')).toBe('12 rép.')
  })

  it('affiche date et heure dans le fuseau de l’utilisateur', () => {
    const instant = '2026-10-14T21:00:00.000Z'
    expect(formatShortDate(instant, 'Europe/Paris')).toBe('mer. 14 oct.')
    expect(formatShortDate(instant, 'Asia/Tokyo')).toBe('jeu. 15 oct.')
    expect(formatTime(instant, 'Europe/Paris')).toBe('23:00')
    expect(formatTime(instant, 'UTC')).toBe('21:00')
  })

  it('formate les durées de séance et le minuteur', () => {
    expect(formatDuration(42 * 60)).toBe('42 min')
    expect(formatDuration(65 * 60)).toBe('1 h 05')
    expect(formatClock(90)).toBe('1:30')
    expect(formatClock(-3)).toBe('0:00')
  })
})

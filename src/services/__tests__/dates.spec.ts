import { describe, expect, it } from 'vitest'

import {
  addDays,
  addMonths,
  dateKey,
  daysBetween,
  endOfMonth,
  endOfWeek,
  formatDayMonth,
  formatLongDate,
  formatMonthYear,
  formatWeekRange,
  formatWeekdayShort,
  monthGrid,
  startOfWeek,
  weekDays,
} from '../dates'

describe('clé de jour et fuseau', () => {
  it('rattache un instant au bon jour selon le fuseau', () => {
    // 14 octobre 23 h à Paris = 21 h UTC, mais déjà le 15 à Tokyo
    const instant = '2026-10-14T21:00:00.000Z'
    expect(dateKey(instant, 'Europe/Paris')).toBe('2026-10-14')
    expect(dateKey(instant, 'UTC')).toBe('2026-10-14')
    expect(dateKey(instant, 'Asia/Tokyo')).toBe('2026-10-15')
    expect(dateKey(instant, 'America/Los_Angeles')).toBe('2026-10-14')
  })

  it('rattache une séance de fin de soirée au jour de l’utilisateur', () => {
    // 1er janvier 00 h 30 à Paris, soit encore le 31 décembre en UTC
    const instant = '2025-12-31T23:30:00.000Z'
    expect(dateKey(instant, 'Europe/Paris')).toBe('2026-01-01')
    expect(dateKey(instant, 'UTC')).toBe('2025-12-31')
  })
})

describe('arithmétique des jours', () => {
  it('traverse un changement d’heure sans décaler le jour', () => {
    // Nuit du passage à l'heure d'hiver en Europe
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25')
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26')
    // Et à l'heure d'été
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29')
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30')
  })

  it('franchit les mois, les années et les années bissextiles', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('compte les jours entre deux dates', () => {
    expect(daysBetween('2026-10-14', '2026-10-21')).toBe(7)
    expect(daysBetween('2026-10-21', '2026-10-14')).toBe(-7)
    expect(daysBetween('2026-10-14', '2026-10-14')).toBe(0)
  })

  it('cadre le mois', () => {
    expect(endOfMonth('2026-10-14')).toBe('2026-10-31')
    expect(endOfMonth('2026-02-10')).toBe('2026-02-28')
    expect(addMonths('2026-10-14', 2)).toBe('2026-12-01')
    expect(addMonths('2026-01-31', -1)).toBe('2025-12-01')
  })
})

describe('début de semaine', () => {
  // 2026-10-14 est un mercredi
  it('cadre la semaine sur le lundi', () => {
    expect(startOfWeek('2026-10-14', 1)).toBe('2026-10-12')
    expect(endOfWeek('2026-10-14', 1)).toBe('2026-10-18')
  })

  it('cadre la semaine sur le dimanche', () => {
    expect(startOfWeek('2026-10-14', 0)).toBe('2026-10-11')
    expect(endOfWeek('2026-10-14', 0)).toBe('2026-10-17')
  })

  it('laisse un lundi et un dimanche à leur place', () => {
    expect(startOfWeek('2026-10-12', 1)).toBe('2026-10-12')
    expect(startOfWeek('2026-10-11', 0)).toBe('2026-10-11')
    // Un dimanche appartient à la semaine précédente quand elle démarre lundi
    expect(startOfWeek('2026-10-18', 1)).toBe('2026-10-12')
  })

  it('liste les sept jours dans l’ordre d’affichage', () => {
    expect(weekDays('2026-10-14', 1)).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
    ])
    expect(weekDays('2026-10-14', 0)[0]).toBe('2026-10-11')
  })
})

describe('grille de mois', () => {
  it('encadre le mois de semaines entières', () => {
    const grid = monthGrid('2026-10-14', 1)
    expect(grid[0]).toBe('2026-09-28')
    expect(grid.at(-1)).toBe('2026-11-01')
    expect(grid).toHaveLength(35)
    expect(grid.length % 7).toBe(0)
  })

  it('suit le premier jour de semaine choisi', () => {
    const grid = monthGrid('2026-10-14', 0)
    expect(grid[0]).toBe('2026-09-27')
    expect(grid.length % 7).toBe(0)
  })

  it('couvre un mois qui démarre le premier jour de semaine', () => {
    // Février 2027 commence un lundi
    const grid = monthGrid('2027-02-10', 1)
    expect(grid[0]).toBe('2027-02-01')
    expect(grid.at(-1)).toBe('2027-02-28')
    expect(grid).toHaveLength(28)
  })
})

describe('affichage', () => {
  it('formate en français', () => {
    expect(formatWeekdayShort('2026-10-14')).toBe('mer.')
    expect(formatMonthYear('2026-10-14')).toBe('octobre 2026')
    expect(formatLongDate('2026-10-14')).toBe('mercredi 14 octobre 2026')
    expect(formatDayMonth('2026-10-14')).toBe('14 oct.')
    expect(formatDayMonth('2026-11-01')).toBe('1er nov.')
    expect(formatLongDate('2026-11-01')).toBe('dimanche 1er novembre 2026')
  })

  it('résume une semaine, à cheval sur deux mois ou non', () => {
    expect(formatWeekRange('2026-10-14', 1)).toBe('du 12 au 18 octobre')
    expect(formatWeekRange('2026-11-01', 1)).toBe('du 26 oct. au 1er novembre')
  })
})

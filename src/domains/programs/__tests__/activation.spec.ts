import { describe, expect, it } from 'vitest'

import type { ProgramDay } from '@/types/domain'

import { planProgram } from '../activation'

function day(id: string, name: string): ProgramDay {
  return { id, name, exercises: [] }
}

const PUSH_PULL_LEGS = [day('d1', 'Push'), day('d2', 'Pull'), day('d3', 'Legs')]

describe('activation d’un programme', () => {
  it('place les séances sur les jours retenus, en déroulant le programme', () => {
    // 2026-10-19 est un lundi
    const planned = planProgram(PUSH_PULL_LEGS, {
      startDate: '2026-10-19',
      weekdays: [1, 3, 5],
      weeks: 2,
    })

    expect(planned).toEqual([
      { date: '2026-10-19', dayId: 'd1', title: 'Push' },
      { date: '2026-10-21', dayId: 'd2', title: 'Pull' },
      { date: '2026-10-23', dayId: 'd3', title: 'Legs' },
      { date: '2026-10-26', dayId: 'd1', title: 'Push' },
      { date: '2026-10-28', dayId: 'd2', title: 'Pull' },
      { date: '2026-10-30', dayId: 'd3', title: 'Legs' },
    ])
  })

  it('reprend le programme là où il en était quand le cycle ne tombe pas juste', () => {
    // Quatre séances par semaine pour trois jours de programme : le cycle glisse
    const planned = planProgram(PUSH_PULL_LEGS, {
      startDate: '2026-10-19',
      weekdays: [1, 2, 4, 5],
      weeks: 2,
    })

    expect(planned.map((item) => item.title)).toEqual([
      'Push',
      'Pull',
      'Legs',
      'Push',
      'Pull',
      'Legs',
      'Push',
      'Pull',
    ])
  })

  it('démarre au premier jour retenu, même si la date de début n’en est pas un', () => {
    // 2026-10-20 est un mardi, l'entraînement est le mercredi et le samedi
    const planned = planProgram(PUSH_PULL_LEGS, {
      startDate: '2026-10-20',
      weekdays: [3, 6],
      weeks: 1,
    })
    expect(planned.map((item) => item.date)).toEqual(['2026-10-21', '2026-10-24'])
  })

  it('traverse un changement de mois et d’heure d’été', () => {
    const planned = planProgram([day('d1', 'Full body')], {
      startDate: '2026-10-26',
      weekdays: [1],
      weeks: 3,
    })
    expect(planned.map((item) => item.date)).toEqual(['2026-10-26', '2026-11-02', '2026-11-09'])
  })

  it('ne planifie rien sans jour de programme, sans jour retenu ou sans semaine', () => {
    const input = { startDate: '2026-10-19', weekdays: [1], weeks: 1 }
    expect(planProgram([], input)).toEqual([])
    expect(planProgram(PUSH_PULL_LEGS, { ...input, weekdays: [] })).toEqual([])
    expect(planProgram(PUSH_PULL_LEGS, { ...input, weeks: 0 })).toEqual([])
  })

  it('accepte le dimanche comme jour d’entraînement', () => {
    const planned = planProgram([day('d1', 'Full body')], {
      startDate: '2026-10-19',
      weekdays: [0],
      weeks: 1,
    })
    expect(planned.map((item) => item.date)).toEqual(['2026-10-25'])
  })
})

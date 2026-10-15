import { addDays, weekday, type DateKey } from '@/services/dates'
import type { Id, ProgramDay } from '@/types/domain'

/**
 * Activation d'un programme (CDC §6.2) : à partir d'une date de début et de
 * jours d'entraînement, on déroule les jours du programme en boucle.
 *
 * Fonction pure : l'écran se contente de créer les séances planifiées
 * correspondantes. Rien n'est inventé côté dates — un jour non retenu dans
 * la semaine est simplement sauté, le programme reprend où il en était.
 */

export const WEEKDAY_LABELS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.']

export interface ActivationInput {
  startDate: DateKey
  /** Jours retenus, 0 = dimanche … 6 = samedi */
  weekdays: number[]
  /** Nombre de semaines à planifier d'avance */
  weeks: number
}

export interface PlannedSession {
  date: DateKey
  dayId: Id
  title: string
}

export function planProgram(days: ProgramDay[], input: ActivationInput): PlannedSession[] {
  const { startDate, weekdays, weeks } = input
  if (days.length === 0 || weekdays.length === 0 || weeks <= 0) return []

  const planned: PlannedSession[] = []
  let cursor = 0
  for (let offset = 0; offset < weeks * 7; offset += 1) {
    const date = addDays(startDate, offset)
    if (!weekdays.includes(weekday(date))) continue
    const day = days[cursor % days.length]
    if (!day) break
    planned.push({ date, dayId: day.id, title: day.name })
    cursor += 1
  }
  return planned
}

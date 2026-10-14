import { dateKey, type DateKey } from '@/services/dates'
import type { Id, ScheduledWorkout, WorkoutSession } from '@/types/domain'

/**
 * Lecture du calendrier (CDC §4.5) : ce qui est prévu et ce qui a été fait,
 * jour par jour.
 *
 * « Manquée » n'est jamais stocké : un créneau passé sans séance liée est
 * manqué, point. Le statut se recalcule donc à chaque affichage et ne peut
 * pas devenir faux (SCRUM-164 fera la même déduction côté serveur).
 */

export type CalendarStatus = 'planned' | 'done' | 'missed' | 'moved'

export const STATUS_LABELS: Record<CalendarStatus, string> = {
  planned: 'Planifiée',
  done: 'Terminée',
  missed: 'Manquée',
  moved: 'Déplacée',
}

export interface CalendarEntry {
  /** Identifiant d'affichage : celui du créneau, ou de la séance libre */
  id: Id
  day: DateKey
  title: string
  status: CalendarStatus
  scheduledId?: Id
  sessionId?: Id
  movedFrom?: DateKey
  /** Séance achevée mais abandonnée : à distinguer d'une séance réussie */
  abandoned?: boolean
}

export function entryStatus(scheduled: ScheduledWorkout, today: DateKey): CalendarStatus {
  if (scheduled.sessionId || scheduled.status === 'done') return 'done'
  if (scheduled.date < today) return 'missed'
  if (scheduled.status === 'moved') return 'moved'
  return 'planned'
}

export interface CalendarInput {
  scheduled: ScheduledWorkout[]
  sessions: WorkoutSession[]
  today: DateKey
  timeZone?: string
}

/**
 * Entrées du calendrier groupées par jour. Les créneaux viennent d'abord,
 * puis les séances libres — celles qui n'honorent aucun créneau.
 */
export function buildCalendar({
  scheduled,
  sessions,
  today,
  timeZone,
}: CalendarInput): Map<DateKey, CalendarEntry[]> {
  const byDay = new Map<DateKey, CalendarEntry[]>()

  function push(entry: CalendarEntry) {
    const existing = byDay.get(entry.day)
    if (existing) existing.push(entry)
    else byDay.set(entry.day, [entry])
  }

  const linked = new Set(
    scheduled.map((item) => item.sessionId).filter((id): id is Id => id !== undefined),
  )

  for (const item of scheduled) {
    push({
      id: item.id,
      day: item.date,
      title: item.title,
      status: entryStatus(item, today),
      scheduledId: item.id,
      ...(item.sessionId ? { sessionId: item.sessionId } : {}),
      ...(item.movedFrom ? { movedFrom: item.movedFrom } : {}),
    })
  }

  for (const session of sessions) {
    if (linked.has(session.id)) continue
    if (session.status !== 'completed' && session.status !== 'abandoned') continue
    push({
      id: session.id,
      day: dateKey(session.startedAt, timeZone),
      title: session.title,
      status: 'done',
      sessionId: session.id,
      ...(session.status === 'abandoned' ? { abandoned: true } : {}),
    })
  }

  return byDay
}

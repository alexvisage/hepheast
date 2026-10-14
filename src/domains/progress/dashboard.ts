import { summarizeSession } from '@/domains/training/metrics'
import { addDays, dateKey, weekDays, type DateKey, type WeekStart } from '@/services/dates'
import type { WorkoutSession } from '@/types/domain'

/**
 * Agrégats du tableau de bord (CDC §4.1).
 *
 * Fonctions pures : l'écran ne fait que les afficher. Une séance compte pour
 * le jour de son **début**, lu dans le fuseau de l'utilisateur — une séance
 * commencée à 23 h reste celle de la soirée, pas du lendemain.
 */

export interface DayLoad {
  key: DateKey
  sessions: number
  volumeKg: number
}

export interface WeekSummary {
  /** Les sept jours, dans l'ordre d'affichage */
  days: DayLoad[]
  sessions: number
  completedSets: number
  volumeKg: number
  durationSeconds: number
}

export interface WeekOptions {
  weekStartsOn?: WeekStart
  timeZone?: string
}

export function summarizeWeek(
  sessions: WorkoutSession[],
  reference: DateKey,
  { weekStartsOn = 1, timeZone }: WeekOptions = {},
): WeekSummary {
  const days: DayLoad[] = weekDays(reference, weekStartsOn).map((key) => ({
    key,
    sessions: 0,
    volumeKg: 0,
  }))
  const byKey = new Map(days.map((day) => [day.key, day]))
  const summary: WeekSummary = {
    days,
    sessions: 0,
    completedSets: 0,
    volumeKg: 0,
    durationSeconds: 0,
  }

  for (const session of sessions) {
    if (session.status !== 'completed') continue
    const day = byKey.get(dateKey(session.startedAt, timeZone))
    if (!day) continue
    const totals = summarizeSession(session)
    day.sessions += 1
    day.volumeKg += totals.volumeKg
    summary.sessions += 1
    summary.completedSets += totals.completedSets
    summary.volumeKg += totals.volumeKg
    summary.durationSeconds += totals.durationSeconds
  }

  return summary
}

/**
 * Nombre de semaines consécutives, en remontant depuis `reference`, où au
 * moins une séance a été terminée. La régularité parle plus qu'un total.
 */
export function weeklyStreak(
  sessions: WorkoutSession[],
  reference: DateKey,
  { weekStartsOn = 1, timeZone }: WeekOptions = {},
): number {
  const trained = new Set(
    sessions
      .filter((session) => session.status === 'completed')
      .map((session) => dateKey(session.startedAt, timeZone)),
  )
  let streak = 0
  let cursor = reference
  // S'arrête à la première semaine vide ; la semaine en cours compte dès une séance
  for (let week = 0; week < 520; week += 1) {
    const days = weekDays(cursor, weekStartsOn)
    if (!days.some((day) => trained.has(day))) return streak
    streak += 1
    cursor = addDays(days[0] ?? cursor, -1)
  }
  return streak
}

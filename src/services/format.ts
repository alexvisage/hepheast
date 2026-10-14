import type { WeightUnit } from '@/types/domain'

const LOCALE = 'fr-FR'

const numberFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 })

export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

/** « 62,5 kg » ; « — » si la charge n'est pas renseignée */
export function formatLoad(load: number | null, unit: WeightUnit): string {
  return load === null ? '—' : `${formatNumber(load)} ${unit}`
}

/** « 8 × 62,5 kg », ou « 12 rép. » sans charge */
export function formatSet(reps: number | null, load: number | null, unit: WeightUnit): string {
  if (reps === null) return '—'
  return load === null ? `${reps} rép.` : `${reps} × ${formatLoad(load, unit)}`
}

/** « mar. 14 oct. », dans le fuseau de l'utilisateur quand il est connu */
export function formatShortDate(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso))
}

/** « 18:30 » dans le fuseau de l'utilisateur */
export function formatTime(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** « 1 h 05 » ou « 42 min » */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const hours = Math.floor(minutes / 60)
  return hours > 0 ? `${hours} h ${String(minutes % 60).padStart(2, '0')}` : `${minutes} min`
}

/** « 1:30 » pour un minuteur */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.ceil(totalSeconds))
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}

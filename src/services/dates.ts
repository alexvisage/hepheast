/**
 * Dates de l'application (CDC §4.5, §9.2).
 *
 * Les dates de domaine sont des instants ISO en UTC, mais un pratiquant
 * raisonne en jours dans **son** fuseau : une séance du 14 octobre à 23 h à
 * Paris ne doit pas compter pour le 15. Tout passe donc par une « clé de
 * jour » (`2026-10-14`) calculée dans le fuseau de l'utilisateur, puis
 * l'arithmétique se fait sur des minuits UTC, insensibles à l'heure d'été.
 */

const LOCALE = 'fr-FR'
/** en-CA produit directement « 2026-10-14 » */
const KEY_LOCALE = 'en-CA'

/** 1 = lundi, 0 = dimanche (préférence utilisateur) */
export type WeekStart = 1 | 0

/** Jour au format `YYYY-MM-DD` */
export type DateKey = string

/** Jour d'un instant, lu dans le fuseau donné (celui du navigateur par défaut) */
export function dateKey(instant: string | Date, timeZone?: string): DateKey {
  const date = typeof instant === 'string' ? new Date(instant) : instant
  return new Intl.DateTimeFormat(KEY_LOCALE, {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function todayKey(timeZone?: string): DateKey {
  return dateKey(new Date(), timeZone)
}

/** Minuit UTC du jour désigné : support neutre pour calculer et formater */
export function keyToDate(key: DateKey): Date {
  return new Date(`${key}T00:00:00.000Z`)
}

export function addDays(key: DateKey, days: number): DateKey {
  const date = keyToDate(key)
  date.setUTCDate(date.getUTCDate() + days)
  return dateKey(date, 'UTC')
}

/** 0 = dimanche, 1 = lundi… 6 = samedi */
export function weekday(key: DateKey): number {
  return keyToDate(key).getUTCDay()
}

export function startOfWeek(key: DateKey, weekStartsOn: WeekStart = 1): DateKey {
  return addDays(key, -((weekday(key) - weekStartsOn + 7) % 7))
}

export function endOfWeek(key: DateKey, weekStartsOn: WeekStart = 1): DateKey {
  return addDays(startOfWeek(key, weekStartsOn), 6)
}

/** Les sept jours de la semaine contenant `key`, dans l'ordre d'affichage */
export function weekDays(key: DateKey, weekStartsOn: WeekStart = 1): DateKey[] {
  const first = startOfWeek(key, weekStartsOn)
  return Array.from({ length: 7 }, (_, index) => addDays(first, index))
}

export function startOfMonth(key: DateKey): DateKey {
  return `${key.slice(0, 7)}-01`
}

export function addMonths(key: DateKey, months: number): DateKey {
  const date = keyToDate(startOfMonth(key))
  date.setUTCMonth(date.getUTCMonth() + months)
  return dateKey(date, 'UTC')
}

export function isSameMonth(first: DateKey, second: DateKey): boolean {
  return first.slice(0, 7) === second.slice(0, 7)
}

/**
 * Grille de mois complète, alignée sur le premier jour de semaine choisi :
 * les semaines entières encadrant le mois, soit 35 ou 42 jours.
 */
export function monthGrid(key: DateKey, weekStartsOn: WeekStart = 1): DateKey[] {
  const first = startOfWeek(startOfMonth(key), weekStartsOn)
  const last = endOfWeek(endOfMonth(key), weekStartsOn)
  const days: DateKey[] = []
  for (let day = first; day <= last; day = addDays(day, 1)) days.push(day)
  return days
}

export function endOfMonth(key: DateKey): DateKey {
  return addDays(addMonths(key, 1), -1)
}

/** Nombre de jours de `from` à `to`, négatif si `to` précède `from` */
export function daysBetween(from: DateKey, to: DateKey): number {
  const millis = keyToDate(to).getTime() - keyToDate(from).getTime()
  return Math.round(millis / 86_400_000)
}

// --- Affichage -----------------------------------------------------------

function formatKey(key: DateKey, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: 'UTC' }).format(keyToDate(key))
}

/** « 1er » le premier du mois, « 14 » sinon : le français veut l'ordinal */
function dayLabel(key: DateKey): string {
  const day = keyToDate(key).getUTCDate()
  return day === 1 ? '1er' : String(day)
}

/** « mar. » */
export function formatWeekdayShort(key: DateKey): string {
  return formatKey(key, { weekday: 'short' })
}

/** « 14 » */
export function formatDayNumber(key: DateKey): string {
  return formatKey(key, { day: 'numeric' })
}

/** « octobre 2026 » */
export function formatMonthYear(key: DateKey): string {
  return formatKey(key, { month: 'long', year: 'numeric' })
}

/** « mardi 14 octobre 2026 » */
export function formatLongDate(key: DateKey): string {
  const weekday = formatKey(key, { weekday: 'long' })
  return `${weekday} ${dayLabel(key)} ${formatKey(key, { month: 'long', year: 'numeric' })}`
}

/** « 14 oct. » */
export function formatDayMonth(key: DateKey): string {
  return `${dayLabel(key)} ${formatKey(key, { month: 'short' })}`
}

/** « du 13 au 19 octobre » */
export function formatWeekRange(key: DateKey, weekStartsOn: WeekStart = 1): string {
  const first = startOfWeek(key, weekStartsOn)
  const last = endOfWeek(key, weekStartsOn)
  const sameMonth = isSameMonth(first, last)
  const start = sameMonth ? dayLabel(first) : formatDayMonth(first)
  return `du ${start} au ${dayLabel(last)} ${formatKey(last, { month: 'long' })}`
}

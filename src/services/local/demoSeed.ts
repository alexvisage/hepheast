import { addDays, startOfWeek, todayKey, weekday, type DateKey } from '@/services/dates'
import type {
  Prescription,
  ProgramDay,
  SetEntry,
  WeightUnit,
  WorkoutExercise,
  WorkoutSession,
} from '@/types/domain'

import { services } from '../index'

import { clearAll, createId } from './storage'

/**
 * Compte de démonstration : un mois d'entraînement déjà vécu.
 *
 * Sert à voir les écrans remplis — tableau de bord, historique, calendrier,
 * progression — sans saisir quinze séances à la main. Appelé uniquement
 * depuis l'écran de connexion en développement ; **efface les données
 * locales** avant de reconstruire un jeu cohérent.
 *
 * Le scénario : quatre semaines d'un programme upper/lower à quatre séances
 * par semaine, avec une progression de charge crédible, deux séances
 * manquées, une séance abandonnée, et des séances encore à venir.
 */

export const DEMO_EMAIL = 'demo@hephaest.app'
export const DEMO_PASSWORD = 'demonstration1'

const UNIT: WeightUnit = 'kg'
const TIME_ZONE = 'Europe/Paris'
/** Jours d'entraînement : lundi, mardi, jeudi, vendredi */
const WEEKDAYS = [1, 2, 4, 5]
const PAST_WEEKS = 4
const PLANNED_WEEKS = 6
/** Séances non réalisées, en indice de séance (vacances, imprévu) */
const MISSED = new Set([6, 11])

interface DemoPrescription {
  exerciseId: string
  sets: number
  reps: number
  /** Charge de la première semaine ; absente pour le poids du corps */
  load?: number
  /** Progression hebdomadaire */
  step?: number
  restSeconds: number
}

/** Le programme suivi, dans l'ordre des jours */
const PLAN: { name: string; exercises: DemoPrescription[] }[] = [
  {
    name: 'Haut du corps 1',
    exercises: [
      { exerciseId: 'bench-press', sets: 4, reps: 6, load: 60, step: 2.5, restSeconds: 150 },
      { exerciseId: 'barbell-row', sets: 4, reps: 8, load: 50, step: 2.5, restSeconds: 120 },
      { exerciseId: 'overhead-press', sets: 3, reps: 8, load: 35, step: 1.25, restSeconds: 120 },
      { exerciseId: 'barbell-curl', sets: 3, reps: 10, load: 20, step: 1.25, restSeconds: 90 },
      { exerciseId: 'triceps-pushdown', sets: 3, reps: 12, load: 25, step: 1.25, restSeconds: 90 },
    ],
  },
  {
    name: 'Bas du corps 1',
    exercises: [
      { exerciseId: 'back-squat', sets: 4, reps: 6, load: 85, step: 2.5, restSeconds: 180 },
      { exerciseId: 'romanian-deadlift', sets: 3, reps: 8, load: 70, step: 2.5, restSeconds: 150 },
      { exerciseId: 'leg-press', sets: 3, reps: 10, load: 120, step: 5, restSeconds: 120 },
      {
        exerciseId: 'standing-calf-raise',
        sets: 4,
        reps: 12,
        load: 60,
        step: 2.5,
        restSeconds: 60,
      },
    ],
  },
  {
    name: 'Haut du corps 2',
    exercises: [
      { exerciseId: 'pull-up', sets: 4, reps: 7, restSeconds: 150 },
      {
        exerciseId: 'incline-dumbbell-press',
        sets: 4,
        reps: 8,
        load: 22.5,
        step: 1.25,
        restSeconds: 120,
      },
      { exerciseId: 'seated-cable-row', sets: 3, reps: 10, load: 55, step: 2.5, restSeconds: 120 },
      { exerciseId: 'lateral-raise', sets: 3, reps: 15, load: 8, step: 1.25, restSeconds: 60 },
      { exerciseId: 'hammer-curl', sets: 3, reps: 12, load: 14, step: 1.25, restSeconds: 90 },
    ],
  },
  {
    name: 'Bas du corps 2',
    exercises: [
      { exerciseId: 'deadlift', sets: 3, reps: 5, load: 105, step: 5, restSeconds: 180 },
      {
        exerciseId: 'bulgarian-split-squat',
        sets: 3,
        reps: 10,
        load: 20,
        step: 1.25,
        restSeconds: 120,
      },
      { exerciseId: 'leg-curl', sets: 3, reps: 12, load: 40, step: 2.5, restSeconds: 90 },
      { exerciseId: 'hip-thrust', sets: 3, reps: 12, load: 80, step: 5, restSeconds: 120 },
    ],
  },
]

const NOTES = [
  'Bonne énergie, barre qui monte vite.',
  'Dos un peu raide, échauffement rallongé.',
  'Salle bondée, repos plus longs que prévu.',
  'Dernière série limite, on garde la charge la prochaine fois.',
]

const FAVORITES = ['bench-press', 'back-squat', 'deadlift', 'pull-up']

/** Les charges de salle vont par pas de 2,5 kg */
function plate(value: number): number {
  return Math.round(value / 2.5) * 2.5
}

function loadFor(prescription: DemoPrescription, week: number): number | null {
  if (prescription.load === undefined) return null
  return plate(prescription.load + (prescription.step ?? 0) * week)
}

function toPrescription(source: DemoPrescription): Prescription {
  return {
    sets: source.sets,
    reps: source.reps,
    restSeconds: source.restSeconds,
    ...(source.load === undefined ? {} : { targetLoad: source.load, unit: UNIT }),
  }
}

function set(overrides: Partial<SetEntry>): SetEntry {
  return {
    id: createId(),
    kind: 'working',
    status: 'done',
    reps: null,
    load: null,
    unit: UNIT,
    ...overrides,
  }
}

/** Un échauffement à mi-charge, puis les séries de travail */
function buildSets(prescription: DemoPrescription, week: number, index: number): SetEntry[] {
  const load = loadFor(prescription, week)
  const sets: SetEntry[] = []

  if (load !== null) {
    sets.push(set({ kind: 'warmup', reps: 10, load: plate(load * 0.5) }))
  }

  // Une série sur trois finit une répétition plus bas : la réalité, pas le plan
  const short = (week + index) % 3 === 0
  for (let number = 0; number < prescription.sets; number += 1) {
    const last = number === prescription.sets - 1
    sets.push(
      set({
        reps: last && short ? prescription.reps - 1 : prescription.reps,
        load,
      }),
    )
  }
  return sets
}

function buildExercises(day: (typeof PLAN)[number], week: number): WorkoutExercise[] {
  return day.exercises.map((prescription, index) => ({
    id: createId(),
    exerciseId: prescription.exerciseId,
    prescription: toPrescription(prescription),
    sets: buildSets(prescription, week, index),
  }))
}

/** Instant de début : 18 h 30 heure française */
function startedAt(day: DateKey): string {
  return `${day}T16:30:00.000Z`
}

function endedAt(day: DateKey, minutes: number): string {
  const end = new Date(Date.parse(startedAt(day)) + minutes * 60_000)
  return end.toISOString()
}

export interface DemoSeedResult {
  email: string
  password: string
  completed: number
  missed: number
  planned: number
}

export async function seedDemoAccount(): Promise<DemoSeedResult> {
  clearAll()

  const profile = await services.auth.signUp({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    displayName: 'Alex',
  })
  await services.auth.updatePreferences({
    unit: UNIT,
    weekStartsOn: 1,
    timeZone: TIME_ZONE,
    defaultRestSeconds: 120,
    autoRest: true,
  })

  for (const exerciseId of FAVORITES) {
    await services.exercises.setFavorite(exerciseId, true)
  }

  // --- Le programme suivi ------------------------------------------------

  const program = await services.programs.createProgram({
    title: 'Upper / Lower',
    description: 'Quatre séances par semaine, progression de 2,5 kg par semaine.',
  })
  const days: ProgramDay[] = PLAN.map((day) => ({
    id: createId(),
    name: day.name,
    exercises: day.exercises.map((prescription) => ({
      id: createId(),
      exerciseId: prescription.exerciseId,
      sets: prescription.sets,
      reps: prescription.reps,
      restSeconds: prescription.restSeconds,
      ...(prescription.load === undefined ? {} : { targetLoad: prescription.load, unit: UNIT }),
    })),
  }))
  const withDays = await services.programs.saveDays(program.id, days)

  const today = todayKey(TIME_ZONE)
  const start = startOfWeek(addDays(today, -7 * PAST_WEEKS), 1)
  await services.programs.setSchedule(withDays.id, { startDate: start, weekdays: WEEKDAYS })
  await services.programs.markVersionUsed(withDays.id, withDays.currentVersion)

  // --- Les séances, passées et à venir -----------------------------------

  let index = 0
  let completed = 0
  let missed = 0
  let planned = 0

  for (let offset = 0; offset < PLANNED_WEEKS * 7; offset += 1) {
    const day = addDays(start, offset)
    if (!WEEKDAYS.includes(weekday(day))) continue

    const week = Math.floor(offset / 7)
    const template = PLAN[index % PLAN.length]!
    const programDay = days[index % days.length]!
    const current = index
    index += 1

    const scheduled = await services.schedule.createScheduled({
      date: day,
      title: template.name,
      programId: withDays.id,
      programDayId: programDay.id,
    })

    // Les séances d'aujourd'hui et d'après restent à faire
    if (day >= today) {
      planned += 1
      continue
    }
    if (MISSED.has(current)) {
      missed += 1
      continue
    }

    const minutes = 55 + (current % 4) * 5
    const session: WorkoutSession = {
      id: createId(),
      userId: profile.id,
      title: template.name,
      status: 'completed',
      programId: withDays.id,
      programVersion: withDays.currentVersion,
      programDayId: programDay.id,
      startedAt: startedAt(day),
      endedAt: endedAt(day, minutes),
      feeling: ((current % 3) + 2) as 2 | 3 | 4,
      ...(current % 3 === 0 ? { note: NOTES[current % NOTES.length] } : {}),
      exercises: buildExercises(template, week),
    }
    await services.workouts.saveSession(session)
    await services.schedule.linkSession(scheduled.id, session.id)
    completed += 1
  }

  // Une séance abandonnée, pour voir l'étiquette dans l'historique
  const abandonedDay = addDays(start, 16)
  await services.workouts.saveSession({
    id: createId(),
    userId: profile.id,
    title: 'Séance libre',
    status: 'abandoned',
    startedAt: startedAt(abandonedDay),
    endedAt: endedAt(abandonedDay, 12),
    note: 'Dos bloqué, arrêt après les premières séries.',
    exercises: [
      {
        id: createId(),
        exerciseId: 'deadlift',
        sets: [
          set({ kind: 'warmup', reps: 8, load: 60 }),
          set({ reps: 5, load: 100, status: 'skipped' }),
        ],
      },
    ],
  })

  return { email: DEMO_EMAIL, password: DEMO_PASSWORD, completed, missed, planned }
}

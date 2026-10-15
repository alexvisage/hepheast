import type { ProgramDay, ProgramExercise } from '@/types/domain'

/**
 * Modèles de départ (CDC §6.1) : full body, upper/lower et PPL.
 *
 * Trois structures classiques, prescriptions volontairement sobres — c'est
 * un point de départ à adapter, pas un plan d'entraînement prescrit. Les
 * charges cibles sont laissées vides : elles dépendent du pratiquant.
 */

export interface ProgramTemplate {
  id: string
  title: string
  description: string
  /** Jours d'entraînement conseillés, 0 = dimanche */
  weekdays: number[]
  days: { name: string; exercises: Omit<ProgramExercise, 'id'>[] }[]
}

function work(
  exerciseId: string,
  sets: number,
  reps: number,
  restSeconds = 120,
): Omit<ProgramExercise, 'id'> {
  return { exerciseId, sets, reps, restSeconds }
}

export const programTemplates: ProgramTemplate[] = [
  {
    id: 'full-body',
    title: 'Full body',
    description: 'Tout le corps à chaque séance, trois fois par semaine. Idéal pour démarrer.',
    weekdays: [1, 3, 5],
    days: [
      {
        name: 'Séance A',
        exercises: [
          work('back-squat', 3, 5, 180),
          work('bench-press', 3, 5, 180),
          work('barbell-row', 3, 8),
          work('plank', 3, 45, 60),
        ],
      },
      {
        name: 'Séance B',
        exercises: [
          work('deadlift', 3, 5, 180),
          work('overhead-press', 3, 6, 150),
          work('pull-up', 3, 8),
          work('hanging-leg-raise', 3, 10, 60),
        ],
      },
    ],
  },
  {
    id: 'upper-lower',
    title: 'Upper / Lower',
    description: 'Haut du corps et bas du corps en alternance, quatre séances par semaine.',
    weekdays: [1, 2, 4, 5],
    days: [
      {
        name: 'Haut du corps 1',
        exercises: [
          work('bench-press', 4, 6, 150),
          work('barbell-row', 4, 8),
          work('overhead-press', 3, 8),
          work('barbell-curl', 3, 10, 90),
          work('triceps-pushdown', 3, 12, 90),
        ],
      },
      {
        name: 'Bas du corps 1',
        exercises: [
          work('back-squat', 4, 6, 180),
          work('romanian-deadlift', 3, 8, 150),
          work('leg-press', 3, 10),
          work('standing-calf-raise', 4, 12, 60),
        ],
      },
      {
        name: 'Haut du corps 2',
        exercises: [
          work('pull-up', 4, 6),
          work('incline-dumbbell-press', 4, 8),
          work('seated-cable-row', 3, 10),
          work('lateral-raise', 3, 15, 60),
          work('hammer-curl', 3, 12, 90),
        ],
      },
      {
        name: 'Bas du corps 2',
        exercises: [
          work('deadlift', 3, 5, 180),
          work('bulgarian-split-squat', 3, 10, 120),
          work('leg-curl', 3, 12, 90),
          work('hip-thrust', 3, 12),
        ],
      },
    ],
  },
  {
    id: 'ppl',
    title: 'Push / Pull / Legs',
    description: 'Poussée, tirage, jambes. Six séances par semaine pour un volume élevé.',
    weekdays: [1, 2, 3, 4, 5, 6],
    days: [
      {
        name: 'Push',
        exercises: [
          work('bench-press', 4, 8, 150),
          work('overhead-press', 3, 10),
          work('incline-dumbbell-press', 3, 10),
          work('lateral-raise', 3, 15, 60),
          work('triceps-pushdown', 3, 12, 90),
        ],
      },
      {
        name: 'Pull',
        exercises: [
          work('pull-up', 4, 8),
          work('barbell-row', 4, 8),
          work('lat-pulldown', 3, 12),
          work('face-pull', 3, 15, 60),
          work('barbell-curl', 3, 12, 90),
        ],
      },
      {
        name: 'Legs',
        exercises: [
          work('back-squat', 4, 8, 180),
          work('romanian-deadlift', 3, 10, 150),
          work('leg-extension', 3, 12, 90),
          work('leg-curl', 3, 12, 90),
          work('standing-calf-raise', 4, 15, 60),
        ],
      },
    ],
  },
]

export function findTemplate(id: string): ProgramTemplate | undefined {
  return programTemplates.find((template) => template.id === id)
}

/** Jours du modèle, prêts à être stockés dans une version de programme */
export function templateDays(template: ProgramTemplate, createId: () => string): ProgramDay[] {
  return template.days.map((day) => ({
    id: createId(),
    name: day.name,
    exercises: day.exercises.map((exercise) => ({ id: createId(), ...exercise })),
  }))
}

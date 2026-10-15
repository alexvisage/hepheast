import { formatClock, formatLoad } from '@/services/format'
import type { Prescription, ProgramExercise, SetEntry, WeightUnit } from '@/types/domain'

/**
 * Prescription d'un programme, côté séance (CDC §6.2).
 *
 * La prescription est figée au démarrage de la séance : la performance
 * réelle vit dans les séries, la prescription sert de repère et ne bouge
 * plus, même si le programme change ensuite.
 */

export function toPrescription(exercise: ProgramExercise): Prescription {
  return {
    sets: exercise.sets,
    reps: exercise.reps,
    ...(exercise.targetLoad === undefined ? {} : { targetLoad: exercise.targetLoad }),
    ...(exercise.unit === undefined ? {} : { unit: exercise.unit }),
    ...(exercise.restSeconds === undefined ? {} : { restSeconds: exercise.restSeconds }),
    ...(exercise.tempo === undefined ? {} : { tempo: exercise.tempo }),
    ...(exercise.note === undefined ? {} : { note: exercise.note }),
  }
}

/**
 * Séries à pré-remplir. Aucune hausse de charge n'est appliquée : on reprend
 * exactement ce que le programme prescrit (AC de SCRUM-115).
 */
export function prescribedSets(
  prescription: Prescription,
  createId: () => string,
  fallbackUnit: WeightUnit = 'kg',
): SetEntry[] {
  return Array.from({ length: Math.max(1, prescription.sets) }, () => ({
    id: createId(),
    kind: 'working' as const,
    status: 'planned' as const,
    reps: prescription.reps,
    load: prescription.targetLoad ?? null,
    unit: prescription.unit ?? fallbackUnit,
  }))
}

/** « 4 × 8 à 80 kg · repos 2:00 · tempo 3-1-1 » */
export function formatPrescription(prescription: Prescription): string {
  const parts = [`${prescription.sets} × ${prescription.reps}`]
  if (prescription.targetLoad !== undefined) {
    parts[0] += ` à ${formatLoad(prescription.targetLoad, prescription.unit ?? 'kg')}`
  }
  if (prescription.restSeconds !== undefined) {
    parts.push(`repos ${formatClock(prescription.restSeconds)}`)
  }
  if (prescription.tempo) parts.push(`tempo ${prescription.tempo}`)
  return parts.join(' · ')
}

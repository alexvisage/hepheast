import type { z } from 'zod'

export type FieldErrors<T> = Partial<Record<keyof T, string>>

/**
 * Valide des valeurs de formulaire et retourne le premier message par champ.
 * Validation de confort côté client : le serveur revalide toujours.
 */
export function validate<S extends z.ZodType>(
  schema: S,
  values: unknown,
): { data: z.infer<S>; errors: null } | { data: null; errors: FieldErrors<z.infer<S>> } {
  const result = schema.safeParse(values)
  if (result.success) return { data: result.data, errors: null }

  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? '')
    errors[field] ??= issue.message
  }
  return { data: null, errors: errors as FieldErrors<z.infer<S>> }
}

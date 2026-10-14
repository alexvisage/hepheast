import { z } from 'zod'

const email = z.string().trim().min(1, 'Saisissez votre adresse e-mail').email({
  message: 'Cette adresse e-mail n’est pas valide',
})

const displayName = z
  .string()
  .trim()
  .min(2, 'Votre nom doit contenir au moins 2 caractères')
  .max(40, 'Votre nom ne peut pas dépasser 40 caractères')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Saisissez votre mot de passe'),
})

export const registerSchema = z.object({
  displayName,
  email,
  password: z
    .string()
    .min(10, 'Le mot de passe doit contenir au moins 10 caractères')
    .regex(/\d/, 'Le mot de passe doit contenir au moins un chiffre'),
})

/** Profil modifiable depuis l'écran Profil & paramètres (SCRUM-90) */
export const profileSchema = z.object({ displayName })

/** Repos par défaut : de 15 secondes à 10 minutes, par pas de 5 secondes */
export const preferencesSchema = z.object({
  unit: z.enum(['kg', 'lb']),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]),
  timeZone: z.string().min(1, 'Choisissez un fuseau horaire'),
  defaultRestSeconds: z
    .number()
    .int('Indiquez un nombre entier de secondes')
    .min(15, 'Le repos par défaut est de 15 secondes au minimum')
    .max(600, 'Le repos par défaut est de 10 minutes au maximum'),
  autoRest: z.boolean(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type PreferencesInput = z.infer<typeof preferencesSchema>

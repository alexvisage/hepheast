import { z } from 'zod'

const email = z.string().trim().min(1, 'Saisissez votre adresse e-mail').email({
  message: 'Cette adresse e-mail n’est pas valide',
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Saisissez votre mot de passe'),
})

export const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Votre nom doit contenir au moins 2 caractères')
    .max(40, 'Votre nom ne peut pas dépasser 40 caractères'),
  email,
  password: z
    .string()
    .min(10, 'Le mot de passe doit contenir au moins 10 caractères')
    .regex(/\d/, 'Le mot de passe doit contenir au moins un chiffre'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

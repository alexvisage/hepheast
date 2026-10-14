import { describe, expect, it } from 'vitest'

import { validate } from '@/services/validation'

import { loginSchema, registerSchema } from '../schemas'

describe('schémas d’authentification', () => {
  it('signale les champs vides de la connexion', () => {
    const { errors } = validate(loginSchema, { email: '', password: '' })
    expect(errors).toEqual({
      email: 'Saisissez votre adresse e-mail',
      password: 'Saisissez votre mot de passe',
    })
  })

  it('refuse une adresse mal formée', () => {
    const { errors } = validate(loginSchema, { email: 'alex@', password: 'x' })
    expect(errors?.email).toBe('Cette adresse e-mail n’est pas valide')
  })

  it('impose un mot de passe robuste à l’inscription', () => {
    const short = validate(registerSchema, {
      displayName: 'Alex',
      email: 'a@b.fr',
      password: 'abc',
    })
    expect(short.errors?.password).toContain('10 caractères')
    const noDigit = validate(registerSchema, {
      displayName: 'Alex',
      email: 'a@b.fr',
      password: 'abcdefghijk',
    })
    expect(noDigit.errors?.password).toContain('chiffre')
  })

  it('nettoie les espaces superflus', () => {
    const { data } = validate(registerSchema, {
      displayName: '  Alex ',
      email: ' alex@exemple.fr ',
      password: 'motdepasse1',
    })
    expect(data).toEqual({ displayName: 'Alex', email: 'alex@exemple.fr', password: 'motdepasse1' })
  })
})

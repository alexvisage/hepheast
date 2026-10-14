import type { UserProfile } from '@/types/domain'

import { ServiceError, type AuthService } from '../contracts'

import { createId, latency, readJson, removeKey, writeJson } from './storage'

/**
 * Authentification de démonstration, stockée dans le navigateur.
 * Aucune sécurité réelle : elle sera remplacée par Supabase Auth (SCRUM-83).
 */

interface StoredAccount {
  profile: UserProfile
  passwordHash: string
}

const ACCOUNTS_KEY = 'accounts'
const SESSION_KEY = 'session'

async function hash(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function accounts(): StoredAccount[] {
  return readJson<StoredAccount[]>(ACCOUNTS_KEY, [])
}

export function createLocalAuth(): AuthService & { currentUserId(): string | null } {
  return {
    currentUserId() {
      return readJson<string | null>(SESSION_KEY, null)
    },

    async getCurrentUser() {
      const id = this.currentUserId()
      return accounts().find((account) => account.profile.id === id)?.profile ?? null
    },

    async signIn(email, password) {
      await latency(300)
      const normalized = email.trim().toLowerCase()
      const account = accounts().find((item) => item.profile.email === normalized)
      if (!account || account.passwordHash !== (await hash(password))) {
        throw new ServiceError('invalid-credentials', 'Adresse e-mail ou mot de passe incorrect')
      }
      writeJson(SESSION_KEY, account.profile.id)
      return account.profile
    },

    async signUp({ email, password, displayName }) {
      await latency(300)
      const normalized = email.trim().toLowerCase()
      if (accounts().some((item) => item.profile.email === normalized)) {
        throw new ServiceError('email-taken', 'Un compte existe déjà avec cette adresse')
      }
      const profile: UserProfile = {
        id: createId(),
        email: normalized,
        displayName: displayName.trim(),
        preferences: {
          unit: 'kg',
          weekStartsOn: 1,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          defaultRestSeconds: 120,
          autoRest: true,
        },
      }
      writeJson(ACCOUNTS_KEY, [...accounts(), { profile, passwordHash: await hash(password) }])
      writeJson(SESSION_KEY, profile.id)
      return profile
    },

    async signOut() {
      await latency(80)
      removeKey(SESSION_KEY)
    },

    async updateProfile({ displayName }) {
      await latency()
      const id = this.currentUserId()
      const all = accounts()
      const account = all.find((item) => item.profile.id === id)
      if (!account) throw new ServiceError('not-authenticated', 'Session expirée')
      account.profile = { ...account.profile, displayName: displayName.trim() }
      writeJson(ACCOUNTS_KEY, all)
      return account.profile
    },

    async updatePreferences(patch) {
      await latency()
      const id = this.currentUserId()
      const all = accounts()
      const account = all.find((item) => item.profile.id === id)
      if (!account) throw new ServiceError('not-authenticated', 'Session expirée')
      account.profile = {
        ...account.profile,
        preferences: { ...account.profile.preferences, ...patch },
      }
      writeJson(ACCOUNTS_KEY, all)
      return account.profile
    },
  }
}

import type { NavigationGuardWithThis, RouteLocationNormalized } from 'vue-router'

import { useSessionStore } from '@/stores/session'

const GUEST_ONLY = new Set(['login', 'register'])

/** Destination après connexion : uniquement un chemin interne, jamais une URL externe */
export function safeRedirect(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

/**
 * Confort de navigation uniquement : la vraie protection des données
 * est appliquée côté serveur (RLS), jamais par le routeur.
 */
export const authGuard: NavigationGuardWithThis<undefined> = async (
  to: RouteLocationNormalized,
) => {
  const session = useSessionStore()
  await session.init()

  if (!to.meta.public && !session.isAuthenticated) {
    return { name: 'login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } }
  }

  if (session.isAuthenticated && GUEST_ONLY.has(String(to.name))) {
    return safeRedirect(to.query.redirect)
  }

  return true
}

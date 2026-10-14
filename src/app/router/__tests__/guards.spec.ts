import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import { useSessionStore } from '@/stores/session'

import { authGuard, safeRedirect } from '../guards'

const Empty = { template: '<div />' }

function makeRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: Empty },
      { path: '/programmes', name: 'programs', component: Empty },
      { path: '/connexion', name: 'login', component: Empty, meta: { public: true } },
    ],
  })
  router.beforeEach(authGuard)
  return router
}

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renvoie vers la connexion en gardant la page demandée', async () => {
    const router = makeRouter()
    await router.push('/programmes')
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/programmes')
  })

  it('laisse passer un utilisateur connecté et le détourne de la connexion', async () => {
    const session = useSessionStore()
    await session.signUp({ email: 'alex@example.com', password: 'motdepasse', displayName: 'Alex' })
    const router = makeRouter()
    await router.push('/programmes')
    expect(router.currentRoute.value.name).toBe('programs')
    await router.push('/connexion?redirect=/programmes')
    expect(router.currentRoute.value.fullPath).toBe('/programmes')
  })
})

describe('safeRedirect', () => {
  it('refuse les redirections externes', () => {
    expect(safeRedirect('//evil.example')).toBe('/')
    expect(safeRedirect('https://evil.example')).toBe('/')
    expect(safeRedirect('/calendrier')).toBe('/calendrier')
  })
})

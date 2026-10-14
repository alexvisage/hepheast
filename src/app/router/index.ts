import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

import { authGuard } from './guards'
import { routes } from './routes'

export type LayoutName = 'app' | 'auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** Titre affiché dans l'onglet et l'en-tête de page */
    title?: string
    /** Gabarit de page ; « app » par défaut */
    layout?: LayoutName
    /** Accessible sans être connecté */
    public?: boolean
    /** Écran plein focus (séance active) : navigation principale masquée sur mobile */
    focus?: boolean
  }
}

export const APP_NAME = 'HEPHAEST'

export const router = createRouter({
  // Le mode hash sert aux aperçus statiques hébergés sans réécriture d'URL
  history:
    import.meta.env.VITE_ROUTER_MODE === 'hash'
      ? createWebHashHistory()
      : createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (_to, _from, savedPosition) => savedPosition ?? { top: 0 },
})

router.beforeEach(authGuard)

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · ${APP_NAME}` : APP_NAME
})

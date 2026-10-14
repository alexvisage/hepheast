/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** « hash » pour un build d'aperçu statique */
  readonly VITE_ROUTER_MODE?: 'hash' | 'history'
}

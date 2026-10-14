import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { services } from '@/services'
import type { UserPreferences, UserProfile } from '@/types/domain'

/** Utilisateur connecté et actions de compte */
export const useSessionStore = defineStore('session', () => {
  const user = ref<UserProfile | null>(null)
  const ready = ref(false)
  let loading: Promise<void> | null = null

  const isAuthenticated = computed(() => user.value !== null)
  const preferences = computed(() => user.value?.preferences)

  /** Charge la session existante une seule fois, même si plusieurs appels arrivent en parallèle */
  function init(): Promise<void> {
    loading ??= services.auth.getCurrentUser().then((current) => {
      user.value = current
      ready.value = true
    })
    return loading
  }

  async function signIn(email: string, password: string) {
    user.value = await services.auth.signIn(email, password)
  }

  async function signUp(input: { email: string; password: string; displayName: string }) {
    user.value = await services.auth.signUp(input)
  }

  async function signOut() {
    await services.auth.signOut()
    user.value = null
  }

  async function updatePreferences(patch: Partial<UserPreferences>) {
    user.value = await services.auth.updatePreferences(patch)
  }

  return {
    user,
    ready,
    isAuthenticated,
    preferences,
    init,
    signIn,
    signUp,
    signOut,
    updatePreferences,
  }
})

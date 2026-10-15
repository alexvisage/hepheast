<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/ui/BaseButton.vue'
import TextField from '@/components/ui/TextField.vue'
import { safeRedirect } from '@/app/router/guards'
import { ServiceError } from '@/services'
import { validate, type FieldErrors } from '@/services/validation'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@/stores/toasts'

import { loginSchema, type LoginInput } from '../schemas'

const session = useSessionStore()
const toasts = useToastStore()
const router = useRouter()
const route = useRoute()

const form = reactive<LoginInput>({ email: '', password: '' })
const errors = ref<FieldErrors<LoginInput>>({})
const formError = ref('')
const submitting = ref(false)
const seeding = ref(false)

/** Outil de développement : le jeu de démonstration n'existe pas en production */
const isDev = import.meta.env.DEV

/**
 * Remplit un compte de démonstration — un mois d'entraînement — puis s'y
 * connecte. Le module est chargé à la demande : il reste hors du bundle de
 * production.
 */
async function fillDemo() {
  formError.value = ''
  seeding.value = true
  try {
    const { seedDemoAccount } = await import('@/services/local/demoSeed')
    const demo = await seedDemoAccount()
    await session.signIn(demo.email, demo.password)
    await router.replace({ name: 'dashboard' })
    toasts.show(
      `${demo.completed} séances enregistrées, ${demo.missed} manquées, ${demo.planned} à venir`,
      'success',
    )
  } catch {
    formError.value = 'Le jeu de démonstration n’a pas pu être créé.'
  } finally {
    seeding.value = false
  }
}

async function submit() {
  formError.value = ''
  const result = validate(loginSchema, form)
  if (result.errors) {
    errors.value = result.errors
    return
  }
  errors.value = {}
  submitting.value = true
  try {
    await session.signIn(result.data.email, result.data.password)
    await router.replace(safeRedirect(route.query.redirect))
  } catch (error) {
    formError.value =
      error instanceof ServiceError
        ? error.message
        : 'Connexion impossible pour le moment. Réessayez dans un instant.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="auth-form">
    <header class="auth-form__header">
      <h1>Connexion</h1>
      <p class="text-muted">Reprends là où ta dernière séance s’est arrêtée.</p>
    </header>

    <form class="auth-form__fields" novalidate @submit.prevent="submit">
      <p v-if="formError" class="auth-form__error" role="alert">{{ formError }}</p>
      <TextField
        v-model="form.email"
        label="Adresse e-mail"
        type="email"
        autocomplete="email"
        :error="errors.email"
        required
      />
      <TextField
        v-model="form.password"
        label="Mot de passe"
        type="password"
        autocomplete="current-password"
        :error="errors.password"
        required
      />
      <BaseButton type="submit" size="lg" block :loading="submitting">Se connecter</BaseButton>
    </form>

    <p class="auth-form__switch">
      Pas encore de compte ?
      <RouterLink :to="{ name: 'register', query: route.query }">Créer un compte</RouterLink>
    </p>

    <section v-if="isDev" class="demo">
      <h2 class="demo__title">Développement</h2>
      <BaseButton variant="secondary" block :loading="seeding" @click="fillDemo">
        Remplir un compte de démonstration
      </BaseButton>
      <p class="demo__hint">
        Un mois d’entraînement : programme actif, séances réalisées, manquées, une abandonnée et des
        séances à venir. <strong>Efface les données locales.</strong>
      </p>
    </section>
  </div>
</template>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.auth-form__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.auth-form__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.auth-form__error {
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--color-danger);
  background-color: var(--color-danger-soft);
  border-radius: var(--radius-md);
}

.auth-form__switch {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.demo {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
}

.demo__title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
}

.demo__hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>

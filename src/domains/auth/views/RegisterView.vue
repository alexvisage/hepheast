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

import { registerSchema, type RegisterInput } from '../schemas'

const session = useSessionStore()
const toasts = useToastStore()
const router = useRouter()
const route = useRoute()

const form = reactive<RegisterInput>({ displayName: '', email: '', password: '' })
const errors = ref<FieldErrors<RegisterInput>>({})
const formError = ref('')
const submitting = ref(false)

async function submit() {
  formError.value = ''
  const result = validate(registerSchema, form)
  if (result.errors) {
    errors.value = result.errors
    return
  }
  errors.value = {}
  submitting.value = true
  try {
    await session.signUp(result.data)
    toasts.show(`Bienvenue ${result.data.displayName} !`, 'success')
    await router.replace(safeRedirect(route.query.redirect))
  } catch (error) {
    if (error instanceof ServiceError && error.code === 'email-taken') {
      errors.value = { email: error.message }
    } else {
      formError.value = 'Création du compte impossible pour le moment. Réessayez dans un instant.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="auth-form">
    <header class="auth-form__header">
      <h1>Créer un compte</h1>
      <p class="text-muted">Gratuit. Tes données d’entraînement restent les tiennes.</p>
    </header>

    <form class="auth-form__fields" novalidate @submit.prevent="submit">
      <p v-if="formError" class="auth-form__error" role="alert">{{ formError }}</p>
      <TextField
        v-model="form.displayName"
        label="Nom affiché"
        autocomplete="nickname"
        :error="errors.displayName"
        required
      />
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
        autocomplete="new-password"
        hint="10 caractères minimum, dont un chiffre"
        :error="errors.password"
        required
      />
      <BaseButton type="submit" size="lg" block :loading="submitting">Créer mon compte</BaseButton>
    </form>

    <p class="auth-form__switch">
      Déjà inscrit ?
      <RouterLink :to="{ name: 'login', query: route.query }">Se connecter</RouterLink>
    </p>
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
</style>

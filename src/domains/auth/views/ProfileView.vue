<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import NumberStepper from '@/components/ui/NumberStepper.vue'
import StateView from '@/components/ui/StateView.vue'
import TextField from '@/components/ui/TextField.vue'
import { formatClock } from '@/services/format'
import { validate } from '@/services/validation'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@/stores/toasts'
import type { WeightUnit } from '@/types/domain'

import { preferencesSchema, profileSchema } from '../schemas'

/**
 * Profil et paramètres (CDC §4.1, AC-01).
 *
 * Les préférences vivent dans le store de session : les enregistrer suffit à
 * les appliquer partout (dates du calendrier, unités, repos par défaut).
 * Le schéma Zod valide côté client ; le serveur revalidera.
 */
const TIME_ZONES = buildTimeZones()

const session = useSessionStore()
const toasts = useToastStore()
const router = useRouter()

const displayName = ref('')
const unit = ref<WeightUnit>('kg')
const weekStartsOn = ref<0 | 1>(1)
const timeZone = ref('Europe/Paris')
const defaultRestSeconds = ref<number | null>(120)
const autoRest = ref(true)

const nameError = ref<string | undefined>(undefined)
const restError = ref<string | undefined>(undefined)
const savingProfile = ref(false)
const savingPreferences = ref(false)

const user = computed(() => session.user)

/** Liste du navigateur si elle existe, sinon quelques fuseaux courants */
function buildTimeZones(): string[] {
  const supported = Intl.supportedValuesOf?.('timeZone')
  if (supported && supported.length > 0) return [...supported]
  return ['Europe/Paris', 'Europe/London', 'UTC', 'America/New_York', 'Asia/Tokyo']
}

/** Recopie le profil chargé dans le formulaire */
watch(
  user,
  (current) => {
    if (!current) return
    displayName.value = current.displayName
    unit.value = current.preferences.unit
    weekStartsOn.value = current.preferences.weekStartsOn
    timeZone.value = current.preferences.timeZone
    defaultRestSeconds.value = current.preferences.defaultRestSeconds
    autoRest.value = current.preferences.autoRest !== false
  },
  { immediate: true },
)

async function saveProfile() {
  const { data, errors } = validate(profileSchema, { displayName: displayName.value })
  nameError.value = errors?.displayName
  if (!data) return
  savingProfile.value = true
  try {
    await session.updateProfile(data)
    toasts.show('Profil enregistré', 'success')
  } catch {
    toasts.show('Le profil n’a pas pu être enregistré. Réessaie.', 'danger')
  } finally {
    savingProfile.value = false
  }
}

async function savePreferences() {
  const { data, errors } = validate(preferencesSchema, {
    unit: unit.value,
    weekStartsOn: weekStartsOn.value,
    timeZone: timeZone.value,
    defaultRestSeconds: defaultRestSeconds.value,
    autoRest: autoRest.value,
  })
  restError.value = errors?.defaultRestSeconds
  if (!data) return
  savingPreferences.value = true
  try {
    await session.updatePreferences(data)
    toasts.show('Préférences enregistrées', 'success')
  } catch {
    toasts.show('Les préférences n’ont pas pu être enregistrées. Réessaie.', 'danger')
  } finally {
    savingPreferences.value = false
  }
}

async function signOut() {
  await session.signOut()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="profile">
    <header class="profile__header">
      <h1>Profil et paramètres</h1>
      <p class="text-muted">Ton compte et la façon dont l’application te parle.</p>
    </header>

    <StateView
      v-if="!user"
      kind="empty"
      title="Aucun compte chargé"
      description="Connecte-toi pour voir et modifier tes paramètres."
    >
      <BaseButton :to="{ name: 'login' }">Se connecter</BaseButton>
    </StateView>

    <template v-else>
      <BaseCard title="Compte">
        <form class="profile__form" @submit.prevent="saveProfile">
          <TextField
            v-model="displayName"
            label="Nom affiché"
            :error="nameError"
            required
            autocomplete="name"
          />
          <p class="profile__email text-muted">
            Adresse e-mail : <strong>{{ user.email }}</strong>
            <span class="profile__hint">Elle ne se change pas encore depuis l’application.</span>
          </p>
          <BaseButton type="submit" :loading="savingProfile">Enregistrer le profil</BaseButton>
        </form>
      </BaseCard>

      <BaseCard title="Préférences">
        <form class="profile__form" @submit.prevent="savePreferences">
          <fieldset class="profile__group">
            <legend class="profile__legend">Unité de charge</legend>
            <div class="profile__choices">
              <label v-for="option in ['kg', 'lb'] as WeightUnit[]" :key="option" class="choice">
                <input v-model="unit" type="radio" name="unit" :value="option" />
                {{ option === 'kg' ? 'Kilogrammes (kg)' : 'Livres (lb)' }}
              </label>
            </div>
          </fieldset>

          <fieldset class="profile__group">
            <legend class="profile__legend">La semaine commence le</legend>
            <div class="profile__choices">
              <label class="choice">
                <input v-model="weekStartsOn" type="radio" name="week" :value="1" />
                Lundi
              </label>
              <label class="choice">
                <input v-model="weekStartsOn" type="radio" name="week" :value="0" />
                Dimanche
              </label>
            </div>
          </fieldset>

          <label class="profile__field">
            <span class="profile__legend">Fuseau horaire</span>
            <select v-model="timeZone" class="profile__select">
              <option v-for="zone in TIME_ZONES" :key="zone" :value="zone">{{ zone }}</option>
            </select>
          </label>

          <div class="profile__rest">
            <NumberStepper
              v-model="defaultRestSeconds"
              label="Repos par défaut (secondes)"
              :step="15"
              :min="15"
              :max="600"
            />
            <p class="text-muted profile__hint">
              Soit {{ formatClock(defaultRestSeconds ?? 0) }} entre deux séries.
            </p>
            <p v-if="restError" class="profile__error" role="alert">{{ restError }}</p>
          </div>

          <label class="choice">
            <input v-model="autoRest" type="checkbox" />
            Lancer le repos automatiquement après chaque série validée
          </label>

          <BaseButton type="submit" :loading="savingPreferences">
            Enregistrer les préférences
          </BaseButton>
        </form>
      </BaseCard>

      <BaseCard title="Session">
        <p class="text-muted">
          Tes données restent sur cet appareil tant que le serveur n’est pas branché.
        </p>
        <BaseButton variant="danger" @click="signOut">Se déconnecter</BaseButton>
      </BaseCard>
    </template>
  </div>
</template>

<style scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 36rem;
}

.profile__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.profile__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: flex-start;
}

.profile__form > :not(.button) {
  width: 100%;
}

.profile__group {
  padding: 0;
  border: 0;
}

.profile__legend {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.profile__choices {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.choice {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 2.5rem;
  font-size: var(--font-size-sm);
}

.profile__field {
  display: flex;
  flex-direction: column;
}

.profile__select {
  width: 100%;
  min-height: var(--touch-target);
  padding: 0 var(--space-3);
  background-color: var(--color-bg-sunken);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
}

.profile__select:focus-visible {
  border-color: var(--color-focus);
}

.profile__rest {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.profile__email {
  font-size: var(--font-size-sm);
}

.profile__hint {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-subtle);
}

.profile__error {
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}
</style>

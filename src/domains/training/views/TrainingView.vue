<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Play } from '@lucide/vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StateView from '@/components/ui/StateView.vue'
import TextField from '@/components/ui/TextField.vue'
import { formatShortDate } from '@/services/format'
import { useToastStore } from '@/stores/toasts'

import { useActiveSessionStore } from '../activeSessionStore'

const active = useActiveSessionStore()
const toasts = useToastStore()
const router = useRouter()

const title = ref('')
const starting = ref(false)

onMounted(() => {
  if (!active.loaded) void active.load()
})

async function start() {
  starting.value = true
  try {
    await active.start(title.value.trim() || undefined)
    await router.push({ name: 'active-session' })
  } catch {
    toasts.show('Impossible de démarrer la séance. Réessayez.', 'danger')
  } finally {
    starting.value = false
  }
}
</script>

<template>
  <div class="training">
    <header class="training__header">
      <h1>Entraînement</h1>
      <p class="text-muted">Démarre une séance et saisis tes séries au fil de l’eau.</p>
    </header>

    <StateView v-if="!active.loaded" kind="loading" />

    <BaseCard v-else-if="active.session" title="Séance en cours" class="training__resume">
      <p>
        <strong>{{ active.session.title }}</strong>
        <span class="text-muted">
          , commencée {{ formatShortDate(active.session.startedAt) }}
        </span>
      </p>
      <BaseButton :to="{ name: 'active-session' }" size="lg" block>
        <template #icon><Play :size="20" aria-hidden="true" /></template>
        Reprendre la séance
      </BaseButton>
    </BaseCard>

    <BaseCard v-else title="Nouvelle séance">
      <form class="training__form" @submit.prevent="start">
        <TextField
          v-model="title"
          label="Nom de la séance"
          placeholder="Séance libre"
          hint="Facultatif : Push, Jambes, Haut du corps…"
        />
        <BaseButton type="submit" size="lg" block :loading="starting">
          <template #icon><Play :size="20" aria-hidden="true" /></template>
          Démarrer la séance
        </BaseButton>
      </form>
    </BaseCard>
  </div>
</template>

<style scoped>
.training {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 40rem;
}

.training__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.training__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.training__resume {
  border-color: var(--color-accent);
}
</style>

<script setup lang="ts">
import { ref } from 'vue'
import { Play, Plus } from '@lucide/vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import IconButton from '@/components/ui/IconButton.vue'
import NumberStepper from '@/components/ui/NumberStepper.vue'
import StateView from '@/components/ui/StateView.vue'
import SyncStatus from '@/components/ui/SyncStatus.vue'
import TextField from '@/components/ui/TextField.vue'
import { useToastStore } from '@/stores/toasts'

/** Catalogue vivant des composants partagés, pour développer et revoir l'UI */

const toasts = useToastStore()

const email = ref('')
const load = ref<number | null>(62.5)
const reps = ref<number | null>(8)
const dialogOpen = ref(false)

const swatches = [
  ['Fond', '--color-bg'],
  ['Surface', '--color-surface'],
  ['Surface relevée', '--color-surface-raised'],
  ['Bordure', '--color-border-strong'],
  ['Cuivre', '--color-accent'],
  ['Vert-de-gris', '--color-success'],
  ['Laiton', '--color-warning'],
  ['Braise', '--color-danger'],
] as const
</script>

<template>
  <div class="design-system">
    <header class="design-system__intro">
      <h1>Design system</h1>
      <p class="text-muted">
        Composants partagés de HEPHAEST. Chaque composant utilise uniquement les tokens de
        <code>src/styles/tokens.css</code>.
      </p>
    </header>

    <BaseCard title="Couleurs">
      <ul class="swatches" role="list">
        <li v-for="[name, token] in swatches" :key="token" class="swatch">
          <span class="swatch__chip" :style="{ backgroundColor: `var(${token})` }" />
          <span>{{ name }}</span>
          <code class="text-muted">{{ token }}</code>
        </li>
      </ul>
    </BaseCard>

    <BaseCard title="Typographie">
      <h1>Forge ta progression</h1>
      <h2>Séance du jour</h2>
      <h3>Développé couché</h3>
      <p>
        Le texte courant reste lisible en salle : largeur normale, interlignage généreux, chiffres
        tabulaires.
      </p>
      <p class="figure type-figure">102,5 <span class="text-muted">kg</span></p>
    </BaseCard>

    <BaseCard title="Boutons">
      <div class="row">
        <BaseButton>
          <template #icon><Play :size="18" aria-hidden="true" /></template>
          Démarrer
        </BaseButton>
        <BaseButton variant="secondary">Dupliquer</BaseButton>
        <BaseButton variant="ghost">Annuler</BaseButton>
        <BaseButton variant="danger">Supprimer</BaseButton>
        <BaseButton loading>Enregistrer</BaseButton>
        <IconButton label="Ajouter un exercice" variant="secondary">
          <Plus :size="20" aria-hidden="true" />
        </IconButton>
      </div>
      <BaseButton size="lg" block>Terminer la séance</BaseButton>
    </BaseCard>

    <BaseCard title="Champs">
      <TextField
        v-model="email"
        label="Adresse e-mail"
        type="email"
        hint="Celle que vous utilisez pour vous connecter"
      />
      <TextField label="Mot de passe" type="password" error="8 caractères minimum" />
      <div class="row row--steppers">
        <NumberStepper v-model="load" label="Charge" unit="kg" :step="2.5" />
        <NumberStepper v-model="reps" label="Répétitions" />
      </div>
    </BaseCard>

    <BaseCard title="Retours">
      <div class="row">
        <BaseButton variant="secondary" @click="toasts.show('Séance enregistrée', 'success')">
          Notification de succès
        </BaseButton>
        <BaseButton
          variant="secondary"
          @click="toasts.show('Connexion perdue, la saisie reste sur cet appareil', 'warning')"
        >
          Notification d'alerte
        </BaseButton>
        <BaseButton variant="danger" @click="dialogOpen = true">Ouvrir la confirmation</BaseButton>
      </div>
      <div class="row">
        <SyncStatus state="saved" />
        <SyncStatus state="pending" />
        <SyncStatus state="offline" />
        <SyncStatus state="error" />
      </div>
    </BaseCard>

    <BaseCard title="États">
      <div class="states">
        <StateView kind="loading" />
        <StateView
          kind="empty"
          title="Aucune séance cette semaine"
          description="Démarrez une séance vierge ou suivez votre programme."
        >
          <BaseButton>Démarrer une séance</BaseButton>
        </StateView>
        <StateView
          kind="error"
          description="Vérifiez votre connexion puis réessayez."
          title="Impossible de charger l'historique"
        >
          <BaseButton variant="secondary">Réessayer</BaseButton>
        </StateView>
        <StateView kind="offline" description="Vos séries sont gardées sur cet appareil." />
      </div>
    </BaseCard>

    <ConfirmDialog
      v-model:open="dialogOpen"
      title="Abandonner la séance ?"
      confirm-label="Abandonner"
      danger
      @confirm="toasts.show('Séance abandonnée')"
    >
      Les 12 séries saisies seront supprimées. Cette action est définitive.
    </ConfirmDialog>
  </div>
</template>

<style scoped>
.design-system {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.design-system__intro {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.row--steppers {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: var(--space-4);
}

.swatch {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
}

.swatch__chip {
  height: 3rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
}

.type-figure {
  font-size: var(--font-size-display);
}

.type-figure span {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
}

.states {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--space-4);
}
</style>

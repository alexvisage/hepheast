<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ListChecks, User } from '@lucide/vue'

import AppLogo from '@/components/AppLogo.vue'

import MobileTabBar from './MobileTabBar.vue'

const route = useRoute()

/** Pendant une séance, l'écran reste concentré sur la saisie */
const focusMode = computed(() => route.meta.focus === true)
</script>

<template>
  <div class="app-layout" :class="{ 'app-layout--focus': focusMode }">
    <header class="top-bar">
      <RouterLink to="/" class="top-bar__home" aria-label="HEPHAEST, tableau de bord">
        <AppLogo :size="28" />
      </RouterLink>
      <nav class="top-bar__actions" aria-label="Raccourcis">
        <RouterLink :to="{ name: 'exercises' }" class="top-bar__action" aria-label="Exercices">
          <ListChecks :size="22" aria-hidden="true" />
        </RouterLink>
        <RouterLink :to="{ name: 'profile' }" class="top-bar__action" aria-label="Profil">
          <User :size="22" aria-hidden="true" />
        </RouterLink>
      </nav>
    </header>

    <main id="main-content" class="app-layout__main" tabindex="-1">
      <slot />
    </main>

    <MobileTabBar v-if="!focusMode" />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100dvh;
}

.top-bar {
  position: sticky;
  top: 0;
  z-index: var(--z-nav);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 3.5rem;
  padding: 0 var(--space-2) 0 var(--space-4);
  background-color: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.top-bar__home {
  text-decoration: none;
  border-radius: var(--radius-sm);
}

.top-bar__actions {
  display: flex;
}

.top-bar__action {
  display: grid;
  place-items: center;
  width: var(--touch-target);
  height: var(--touch-target);
  color: var(--color-text-muted);
  border-radius: var(--radius-md);
}

.top-bar__action.router-link-active {
  color: var(--color-accent-text);
}

.app-layout__main {
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  padding: var(--space-5) var(--space-4) calc(5.5rem + env(safe-area-inset-bottom));
}

.app-layout__main:focus {
  outline: none;
}

.app-layout--focus .app-layout__main {
  padding-bottom: var(--space-7);
}
</style>

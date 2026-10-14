<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Settings } from '@lucide/vue'

import AppLogo from '@/components/AppLogo.vue'

import { isActive, practitionerNav } from '../navigation'

const route = useRoute()
</script>

<template>
  <aside class="sidebar">
    <RouterLink to="/" class="sidebar__home" aria-label="HEPHAEST, tableau de bord">
      <AppLogo />
    </RouterLink>

    <nav aria-label="Navigation principale">
      <ul class="sidebar__list" role="list">
        <li v-for="item in practitionerNav" :key="item.match">
          <RouterLink
            :to="item.to"
            class="sidebar__link"
            :class="{ 'sidebar__link--active': isActive(item, route.path) }"
            :aria-current="isActive(item, route.path) ? 'page' : undefined"
          >
            <component :is="item.icon" :size="20" aria-hidden="true" />
            {{ item.label }}
          </RouterLink>
        </li>
      </ul>
    </nav>

    <RouterLink
      :to="{ name: 'profile' }"
      class="sidebar__link sidebar__link--footer"
      active-class="sidebar__link--active"
    >
      <Settings :size="20" aria-hidden="true" />
      Profil et paramètres
    </RouterLink>
  </aside>
</template>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  height: 100dvh;
  padding: var(--space-5) var(--space-3);
  background-color: var(--color-bg-sunken);
  border-right: 1px solid var(--color-border);
}

.sidebar__home {
  padding: 0 var(--space-3);
  text-decoration: none;
  border-radius: var(--radius-sm);
}

.sidebar__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sidebar__link {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 2.75rem;
  padding: 0 var(--space-3);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition:
    color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.sidebar__link:hover {
  color: var(--color-text);
  background-color: var(--color-surface);
}

/* Entrée active : texte cuivre et barre de forge à gauche */
.sidebar__link--active {
  color: var(--color-accent-text);
  background-color: var(--color-surface);
}

.sidebar__link--active::before {
  position: absolute;
  inset: var(--space-2) auto var(--space-2) 0;
  width: 3px;
  content: '';
  background-color: var(--color-accent);
  border-radius: var(--radius-full);
}

.sidebar__link--footer {
  margin-top: auto;
}
</style>

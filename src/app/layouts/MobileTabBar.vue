<script setup lang="ts">
import { useRoute } from 'vue-router'

import { isActive, mobileNav } from '../navigation'

const route = useRoute()
</script>

<template>
  <nav class="tab-bar" aria-label="Navigation principale">
    <ul class="tab-bar__list" role="list">
      <li v-for="item in mobileNav" :key="item.match">
        <RouterLink
          :to="item.to"
          class="tab-bar__link"
          :class="{
            'tab-bar__link--primary': item.primary,
            'tab-bar__link--active': isActive(item, route.path),
          }"
          :aria-current="isActive(item, route.path) ? 'page' : undefined"
        >
          <span class="tab-bar__icon">
            <component :is="item.icon" :size="item.primary ? 24 : 22" aria-hidden="true" />
          </span>
          <span class="tab-bar__label">{{ item.shortLabel }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.tab-bar {
  position: fixed;
  inset: auto 0 0;
  z-index: var(--z-nav);
  padding-bottom: env(safe-area-inset-bottom);
  background-color: var(--color-bg-sunken);
  border-top: 1px solid var(--color-border);
}

.tab-bar__list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  max-width: 32rem;
  margin: 0 auto;
}

.tab-bar__link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 4rem;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-subtle);
  text-decoration: none;
}

.tab-bar__link--active {
  color: var(--color-accent-text);
}

.tab-bar__icon {
  display: grid;
  place-items: center;
}

/* L'entraînement, action principale, posé comme une enclume au centre */
.tab-bar__link--primary .tab-bar__icon {
  width: 3rem;
  height: 2.5rem;
  margin-top: -1rem;
  color: var(--color-text-on-accent);
  background-color: var(--color-accent);
  border: 3px solid var(--color-bg-sunken);
  border-radius: var(--radius-md);
}

.tab-bar__link--primary.tab-bar__link--active .tab-bar__icon {
  background-color: var(--color-accent-hover);
}

@media (width >= 64rem) {
  .tab-bar {
    display: none;
  }
}
</style>

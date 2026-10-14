<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Accessibilité des changements de page dans une SPA :
 * annonce le titre aux lecteurs d'écran et place le focus sur le contenu,
 * comme le ferait un chargement de page classique.
 */
const router = useRouter()
const message = ref('')
let firstNavigation = true

router.afterEach(async (to, from) => {
  if (firstNavigation) {
    firstNavigation = false
    return
  }
  if (to.path === from.path) return
  await nextTick()
  message.value = to.meta.title ?? ''
  document.getElementById('main-content')?.focus({ preventScroll: true })
})
</script>

<template>
  <a href="#main-content" class="skip-link">Aller au contenu</a>
  <p class="visually-hidden" aria-live="polite" aria-atomic="true">{{ message }}</p>
</template>

<style scoped>
.skip-link {
  position: fixed;
  top: var(--space-2);
  left: var(--space-2);
  z-index: var(--z-dialog);
  padding: var(--space-3) var(--space-4);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-on-accent);
  background-color: var(--color-accent);
  border-radius: var(--radius-md);
  transform: translateY(-200%);
}

.skip-link:focus-visible {
  transform: none;
}
</style>

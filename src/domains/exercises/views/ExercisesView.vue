<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import ExerciseSearch from '../components/ExerciseSearch.vue'

const route = useRoute()

/** `/exercices?favoris=1` ouvre directement la liste filtrée (raccourci du tableau de bord) */
const startWithFavorites = computed(() => route.query.favoris === '1')
</script>

<template>
  <div class="exercises-page">
    <header class="exercises-page__header">
      <h1>Exercices</h1>
      <p class="text-muted">Le catalogue, ses consignes et tes performances par mouvement.</p>
    </header>
    <ExerciseSearch :start-with-favorites="startWithFavorites" />
  </div>
</template>

<style scoped>
.exercises-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 48rem;
}

.exercises-page__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>

<script setup lang="ts">
import ExerciseSearch from '../components/ExerciseSearch.vue'
</script>

<template>
  <div class="exercises-page">
    <header class="exercises-page__header">
      <h1>Exercices</h1>
      <p class="text-muted">Le catalogue, ses consignes et tes performances par mouvement.</p>
    </header>
    <ExerciseSearch />
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

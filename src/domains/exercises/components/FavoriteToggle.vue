<script setup lang="ts">
import { computed } from 'vue'
import { Star } from '@lucide/vue'

import type { Exercise } from '@/types/domain'

import { useCatalogStore } from '../catalogStore'

const props = defineProps<{ exercise: Pick<Exercise, 'id' | 'name'> }>()

const catalog = useCatalogStore()
const active = computed(() => catalog.isFavorite(props.exercise.id))
</script>

<template>
  <button
    type="button"
    class="favorite"
    :class="{ 'favorite--active': active }"
    :aria-pressed="active"
    :aria-label="`${exercise.name} en favori`"
    :title="active ? 'Retirer des favoris' : 'Ajouter aux favoris'"
    @click="catalog.toggleFavorite(exercise.id)"
  >
    <Star :size="20" :fill="active ? 'currentColor' : 'none'" aria-hidden="true" />
  </button>
</template>

<style scoped>
.favorite {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: var(--touch-target);
  height: var(--touch-target);
  padding: 0;
  color: var(--color-text-subtle);
  background: transparent;
  border: 0;
  border-radius: var(--radius-md);
}

.favorite:hover {
  color: var(--color-text);
}

.favorite--active {
  color: var(--color-warning);
}
</style>

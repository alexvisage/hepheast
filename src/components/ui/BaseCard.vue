<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    /** Niveau du titre, pour respecter la hiérarchie de la page */
    headingLevel?: 2 | 3
    tag?: 'section' | 'article' | 'div'
  }>(),
  { title: undefined, headingLevel: 2, tag: 'section' },
)
</script>

<template>
  <component :is="tag" class="card">
    <header v-if="title || $slots.actions" class="card__header">
      <component :is="`h${headingLevel}`" v-if="title" class="card__title">{{ title }}</component>
      <div v-if="$slots.actions" class="card__actions"><slot name="actions" /></div>
    </header>
    <slot />
  </component>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.card__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.card__actions {
  display: flex;
  gap: var(--space-2);
}
</style>

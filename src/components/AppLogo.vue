<script setup lang="ts">
/**
 * Logo provisoire : monogramme H dont la traverse est une enclume.
 * À remplacer par la version définitive (SCRUM-78).
 */
withDefaults(defineProps<{ withWordmark?: boolean; size?: number }>(), {
  withWordmark: true,
  size: 32,
})
</script>

<template>
  <span class="logo">
    <svg
      class="logo__mark"
      :width="size"
      :height="size"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="30" height="30" rx="7" class="logo__plate" />
      <path d="M9 7v18M23 7v18" class="logo__pillar" />
      <path d="M7 14h18l-2.5 3.5h-4l1 3h-7l1-3h-4z" class="logo__anvil" />
    </svg>
    <span v-if="withWordmark" class="logo__wordmark">Hephaest</span>
  </span>
</template>

<style scoped>
.logo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text);
}

.logo__plate {
  fill: var(--color-accent-soft);
  stroke: var(--color-accent);
  stroke-width: 1.5;
}

.logo__pillar {
  stroke: var(--color-text);
  stroke-width: 3;
  stroke-linecap: round;
}

.logo__anvil {
  fill: var(--color-accent);
}

.logo__wordmark {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-black);
  font-stretch: var(--font-stretch-wide);
  letter-spacing: 0.02em;
}
</style>

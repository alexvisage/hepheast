<script setup lang="ts">
import { ref, useId, watch } from 'vue'
import { Minus, Plus } from '@lucide/vue'

/**
 * Saisie numérique pensée pour la salle : gros chiffres, boutons −/+ larges,
 * clavier numérique sur mobile, virgule décimale acceptée.
 */
const props = withDefaults(
  defineProps<{
    label: string
    unit?: string
    step?: number
    min?: number
    max?: number
    /** Masque visuellement le libellé (il reste lu par les lecteurs d'écran) */
    hideLabel?: boolean
  }>(),
  { unit: undefined, step: 1, min: 0, max: 9999 },
)

const model = defineModel<number | null>({ default: null })

const id = useId()
const draft = ref(format(model.value))

watch(model, (value) => {
  if (parse(draft.value) !== value) draft.value = format(value)
})

function format(value: number | null): string {
  if (value === null) return ''
  return Number.isInteger(value) ? String(value) : String(value).replace('.', ',')
}

function parse(text: string): number | null {
  const normalized = text.trim().replace(',', '.')
  if (normalized === '') return null
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

function clamp(value: number): number {
  return Math.min(props.max, Math.max(props.min, value))
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function commit() {
  const parsed = parse(draft.value)
  model.value = parsed === null ? null : clamp(round(parsed))
  draft.value = format(model.value)
}

function increment(direction: 1 | -1) {
  const base = model.value ?? 0
  model.value = clamp(round(base + direction * props.step))
  draft.value = format(model.value)
}
</script>

<template>
  <div class="stepper">
    <label :for="id" class="stepper__label" :class="{ 'visually-hidden': hideLabel }">
      {{ label }}
    </label>
    <div class="stepper__control">
      <button
        type="button"
        class="stepper__button"
        :aria-label="`Diminuer ${label.toLowerCase()} de ${step}`"
        :disabled="model !== null && model <= min"
        @click="increment(-1)"
      >
        <Minus :size="20" aria-hidden="true" />
      </button>
      <div class="stepper__value">
        <input
          :id="id"
          v-model="draft"
          class="stepper__input figure"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          placeholder="–"
          @blur="commit"
          @keydown.enter.prevent="commit"
          @keydown.up.prevent="increment(1)"
          @keydown.down.prevent="increment(-1)"
        />
        <span v-if="unit" class="stepper__unit" aria-hidden="true">{{ unit }}</span>
      </div>
      <button
        type="button"
        class="stepper__button"
        :aria-label="`Augmenter ${label.toLowerCase()} de ${step}`"
        :disabled="model !== null && model >= max"
        @click="increment(1)"
      >
        <Plus :size="20" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.stepper {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.stepper__label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
}

.stepper__control {
  display: flex;
  align-items: stretch;
  min-height: 3.5rem;
  background-color: var(--color-bg-sunken);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.stepper__control:focus-within {
  border-color: var(--color-focus);
}

.stepper__button {
  display: grid;
  place-items: center;
  flex: 0 0 2.75rem;
  padding: 0;
  color: var(--color-text-muted);
  background: transparent;
  border: 0;
}

.stepper__button:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.stepper__button:hover:not(:disabled) {
  color: var(--color-text);
  background-color: var(--color-surface-raised);
}

.stepper__value {
  display: flex;
  flex: 1;
  align-items: baseline;
  justify-content: center;
  gap: var(--space-1);
  min-width: 0;
  padding-top: var(--space-3);
}

.stepper__input {
  width: 100%;
  min-width: 0;
  padding: 0;
  font-size: var(--font-size-2xl);
  text-align: center;
  background: transparent;
  border: 0;
}

.stepper__input:focus-visible {
  box-shadow: none;
}

.stepper__input::placeholder {
  color: var(--color-text-subtle);
}

.stepper__unit {
  padding-right: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>

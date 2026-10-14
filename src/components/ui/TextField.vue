<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    type?: 'text' | 'email' | 'password' | 'search'
    hint?: string
    error?: string
    autocomplete?: string
    placeholder?: string
    required?: boolean
  }>(),
  {
    type: 'text',
    hint: undefined,
    error: undefined,
    autocomplete: undefined,
    placeholder: undefined,
  },
)

const model = defineModel<string>({ default: '' })

const id = useId()
const hintId = `${id}-hint`
const errorId = `${id}-error`

const describedBy = computed(
  () =>
    [props.error ? errorId : null, props.hint ? hintId : null].filter(Boolean).join(' ') ||
    undefined,
)
</script>

<template>
  <div class="field" :class="{ 'field--invalid': error }">
    <label :for="id" class="field__label">
      {{ label }}
      <span v-if="required" class="field__required" aria-hidden="true">*</span>
    </label>
    <input
      :id="id"
      v-model="model"
      class="field__input"
      :type="type"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :required="required"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy"
    />
    <p v-if="error" :id="errorId" class="field__error" role="alert">{{ error }}</p>
    <p v-else-if="hint" :id="hintId" class="field__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.field__required {
  color: var(--color-accent-text);
}

.field__input {
  min-height: var(--touch-target);
  padding: 0 var(--space-4);
  background-color: var(--color-bg-sunken);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  transition: border-color var(--duration-fast) var(--ease-out);
}

.field__input::placeholder {
  color: var(--color-text-subtle);
}

.field__input:hover {
  border-color: var(--color-text-subtle);
}

.field__input:focus-visible {
  border-color: var(--color-focus);
}

.field--invalid .field__input {
  border-color: var(--color-danger);
}

.field__hint,
.field__error {
  font-size: var(--font-size-sm);
}

.field__hint {
  color: var(--color-text-muted);
}

.field__error {
  color: var(--color-danger);
}
</style>

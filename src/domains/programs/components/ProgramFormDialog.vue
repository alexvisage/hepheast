<script setup lang="ts">
import { ref, useId, useTemplateRef, watch } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import TextField from '@/components/ui/TextField.vue'
import type { ProgramTemplateSummary } from '@/services'

/**
 * Création et renommage d'un programme (CDC §6.1).
 * À la création, on part de zéro ou d'un modèle ; au renommage, seuls le
 * titre et la description sont en jeu.
 */
const props = withDefaults(
  defineProps<{
    mode?: 'create' | 'rename'
    title?: string
    description?: string
    templates?: ProgramTemplateSummary[]
  }>(),
  { mode: 'create', title: '', description: '', templates: () => [] },
)

const emit = defineEmits<{
  submit: [value: { title: string; description: string; templateId?: string }]
}>()

const open = defineModel<boolean>('open', { default: false })

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const headingId = useId()

const title = ref(props.title)
const description = ref(props.description)
const templateId = ref('')
const error = ref<string | undefined>(undefined)

watch(
  [open, dialog],
  ([isOpen, element]) => {
    if (!element) return
    if (isOpen) {
      title.value = props.title
      description.value = props.description
      templateId.value = ''
      error.value = undefined
      if (!element.open) element.showModal()
    } else if (element.open) {
      element.close()
    }
  },
  { flush: 'post', immediate: true },
)

function cancel() {
  open.value = false
}

function submit() {
  // Un modèle fournit son propre titre : le champ peut rester vide
  if (!title.value.trim() && !templateId.value) {
    error.value = 'Donne un nom à ton programme'
    return
  }
  emit('submit', {
    title: title.value.trim(),
    description: description.value.trim(),
    ...(templateId.value ? { templateId: templateId.value } : {}),
  })
  open.value = false
}
</script>

<template>
  <dialog ref="dialog" class="form" :aria-labelledby="headingId" @cancel.prevent="cancel">
    <form v-if="open" class="form__panel" @submit.prevent="submit">
      <h2 :id="headingId" class="form__title">
        {{ mode === 'rename' ? 'Renommer le programme' : 'Nouveau programme' }}
      </h2>

      <TextField
        v-model="title"
        label="Nom du programme"
        placeholder="Prise de masse, Force 5×5…"
        :error="error"
      />

      <TextField
        v-model="description"
        label="Description"
        placeholder="Trois mois, quatre séances par semaine…"
      />

      <label v-if="mode === 'create' && templates.length > 0" class="form__field">
        <span class="form__label">Partir d’un modèle</span>
        <select v-model="templateId" class="form__select">
          <option value="">Programme vide</option>
          <option v-for="template in templates" :key="template.id" :value="template.id">
            {{ template.title }} — {{ template.dayCount }} jours
          </option>
        </select>
        <span class="form__hint">
          Un modèle crée les jours et les prescriptions ; tout reste modifiable ensuite.
        </span>
      </label>

      <div class="form__actions">
        <BaseButton variant="ghost" @click="cancel">Annuler</BaseButton>
        <BaseButton type="submit">{{ mode === 'rename' ? 'Renommer' : 'Créer' }}</BaseButton>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.form {
  width: min(28rem, calc(100% - 2 * var(--space-3)));
  padding: 0;
  color: var(--color-text);
  background-color: var(--color-surface-raised);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-overlay);
}

.form::backdrop {
  background-color: var(--color-backdrop);
}

.form__panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
}

.form__title {
  font-size: var(--font-size-lg);
}

.form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.form__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.form__select {
  width: 100%;
  min-height: var(--touch-target);
  padding: 0 var(--space-3);
  background-color: var(--color-bg-sunken);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
}

.form__select:focus-visible {
  border-color: var(--color-focus);
}

.form__hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.form__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>

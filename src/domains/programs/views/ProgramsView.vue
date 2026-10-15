<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Plus } from '@lucide/vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import StateView from '@/components/ui/StateView.vue'
import { services, type ProgramTemplateSummary } from '@/services'
import { formatShortDate } from '@/services/format'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@/stores/toasts'
import type { Program, ProgramStatus } from '@/types/domain'

import ProgramFormDialog from '../components/ProgramFormDialog.vue'

/**
 * Bibliothèque de programmes (CDC §6.1) : créer depuis zéro ou un modèle,
 * puis modifier, dupliquer, renommer, archiver.
 *
 * Archiver plutôt que supprimer est la voie normale : un programme suivi
 * reste la référence des séances passées. La suppression est possible mais
 * demande confirmation.
 */
const STATUS_LABELS: Record<ProgramStatus, string> = {
  draft: 'Brouillon',
  active: 'Actif',
  archived: 'Archivé',
}

const session = useSessionStore()
const toasts = useToastStore()

const programs = ref<Program[]>([])
const templates = ref<ProgramTemplateSummary[]>([])
const includeArchived = ref(false)
const status = ref<'loading' | 'ready' | 'error'>('loading')

const creating = ref(false)
const renaming = ref<Program | null>(null)
const deleting = ref<Program | null>(null)
const confirmingDelete = ref(false)

const visible = computed(() =>
  includeArchived.value
    ? programs.value
    : programs.value.filter((program) => program.status !== 'archived'),
)

function dayCount(program: Program): number {
  return (
    program.versions.find((version) => version.version === program.currentVersion)?.days.length ?? 0
  )
}

async function load() {
  status.value = 'loading'
  try {
    const [list, catalogue] = await Promise.all([
      services.programs.listPrograms({ includeArchived: true }),
      services.programs.listTemplates(),
    ])
    programs.value = list
    templates.value = catalogue
    status.value = 'ready'
  } catch {
    status.value = 'error'
  }
}

async function create({
  title,
  description,
  templateId,
}: {
  title: string
  description: string
  templateId?: string
}) {
  try {
    const program = await services.programs.createProgram({
      title,
      ...(description ? { description } : {}),
      ...(templateId ? { templateId } : {}),
    })
    await load()
    toasts.show(`${program.title} créé`, 'success')
  } catch {
    toasts.show('Le programme n’a pas pu être créé. Réessaie.', 'danger')
  }
}

async function rename({ title, description }: { title: string; description: string }) {
  const program = renaming.value
  renaming.value = null
  if (!program) return
  try {
    await services.programs.renameProgram(program.id, { title, description })
    await load()
    toasts.show('Programme renommé', 'success')
  } catch {
    toasts.show('Le programme n’a pas pu être renommé. Réessaie.', 'danger')
  }
}

async function duplicate(program: Program) {
  try {
    const copy = await services.programs.duplicateProgram(program.id)
    await load()
    toasts.show(`${copy.title} créé`, 'success')
  } catch {
    toasts.show('Le programme n’a pas pu être dupliqué. Réessaie.', 'danger')
  }
}

async function setStatus(program: Program, next: ProgramStatus) {
  try {
    await services.programs.setStatus(program.id, next)
    await load()
    toasts.show(next === 'archived' ? `${program.title} archivé` : `${program.title} restauré`)
  } catch {
    toasts.show('Le statut n’a pas pu être changé. Réessaie.', 'danger')
  }
}

function requestDelete(program: Program) {
  deleting.value = program
  confirmingDelete.value = true
}

async function confirmDelete() {
  const program = deleting.value
  deleting.value = null
  if (!program) return
  try {
    await services.programs.deleteProgram(program.id)
    await load()
    toasts.show(`${program.title} supprimé`)
  } catch {
    toasts.show('Le programme n’a pas pu être supprimé. Réessaie.', 'danger')
  }
}

onMounted(load)
</script>

<template>
  <div class="programs">
    <header class="programs__header">
      <div>
        <h1>Programmes</h1>
        <p class="text-muted">Tes plans d’entraînement, à construire ou à suivre.</p>
      </div>
      <BaseButton @click="creating = true">
        <template #icon><Plus :size="18" aria-hidden="true" /></template>
        Nouveau programme
      </BaseButton>
    </header>

    <StateView v-if="status === 'loading'" kind="loading" />

    <StateView
      v-else-if="status === 'error'"
      kind="error"
      description="Tes programmes n’ont pas pu être chargés."
    >
      <BaseButton variant="secondary" @click="load">Réessayer</BaseButton>
    </StateView>

    <StateView
      v-else-if="programs.length === 0"
      kind="empty"
      title="Aucun programme"
      description="Pars d’un modèle — full body, upper/lower ou PPL — ou construis le tien jour par jour."
    >
      <BaseButton @click="creating = true">Créer un programme</BaseButton>
    </StateView>

    <template v-else>
      <label class="programs__filter">
        <input v-model="includeArchived" type="checkbox" />
        Afficher les programmes archivés
      </label>

      <p v-if="visible.length === 0" class="text-muted">Tous tes programmes sont archivés.</p>

      <BaseCard
        v-for="program in visible"
        :key="program.id"
        tag="article"
        class="program"
        :class="{ 'program--archived': program.status === 'archived' }"
      >
        <div class="program__head">
          <h2 class="program__title">
            {{ program.title }}
            <span class="program__badge">{{ STATUS_LABELS[program.status] }}</span>
          </h2>
          <p class="program__meta text-muted">
            {{ dayCount(program) }} jour{{ dayCount(program) > 1 ? 's' : '' }} · version
            {{ program.currentVersion }} · créé le
            {{ formatShortDate(program.createdAt, session.preferences?.timeZone) }}
          </p>
          <p v-if="program.description" class="program__description text-muted">
            {{ program.description }}
          </p>
        </div>

        <div class="program__actions">
          <BaseButton :to="{ name: 'program-editor', params: { id: program.id } }">
            Modifier
          </BaseButton>
          <BaseButton variant="secondary" @click="duplicate(program)">Dupliquer</BaseButton>
          <BaseButton variant="ghost" @click="renaming = program">Renommer</BaseButton>
          <BaseButton
            v-if="program.status === 'archived'"
            variant="ghost"
            @click="setStatus(program, 'draft')"
          >
            Restaurer
          </BaseButton>
          <BaseButton v-else variant="ghost" @click="setStatus(program, 'archived')">
            Archiver
          </BaseButton>
          <BaseButton variant="ghost" @click="requestDelete(program)">Supprimer</BaseButton>
        </div>
      </BaseCard>
    </template>

    <ProgramFormDialog v-model:open="creating" :templates="templates" @submit="create" />

    <ProgramFormDialog
      :open="renaming !== null"
      mode="rename"
      :title="renaming?.title ?? ''"
      :description="renaming?.description ?? ''"
      @submit="rename"
      @update:open="renaming = $event ? renaming : null"
    />

    <ConfirmDialog
      v-model:open="confirmingDelete"
      title="Supprimer ce programme ?"
      confirm-label="Supprimer"
      danger
      @confirm="confirmDelete"
      @cancel="deleting = null"
    >
      {{ deleting?.title }} et toutes ses versions disparaîtront. Tes séances passées restent
      intactes. Pour le garder sous la main sans l’utiliser, archive-le plutôt.
    </ConfirmDialog>
  </div>
</template>

<style scoped>
.programs {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 48rem;
}

.programs__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.programs__filter {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.program--archived {
  border-style: dashed;
}

.program__head {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.program__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-lg);
}

.program__badge {
  padding: 0 var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
}

.program__meta,
.program__description {
  font-size: var(--font-size-sm);
}

.program__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>

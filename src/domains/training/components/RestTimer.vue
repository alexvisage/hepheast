<script setup lang="ts">
import { computed } from 'vue'
import { Pause, Play, Timer, X } from '@lucide/vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { formatClock } from '@/services/format'
import { useToastStore } from '@/stores/toasts'

import { ADJUST_STEP_SECONDS, useRestTimerStore } from '../restTimerStore'

/**
 * Barre de repos : décompte, ±15 s, pause et arrêt (CDC §4.2).
 * Visible seulement quand un repos tourne ou vient de finir ; le reste du
 * temps, un bouton discret permet de le lancer à la main.
 */
const rest = useRestTimerStore()
const toasts = useToastStore()

const progress = computed(() => {
  if (!rest.isActive) return 0
  return Math.min(1, 1 - rest.remainingSeconds / rest.durationSeconds)
})

/** « 1:30 » pendant le repos, « Repos terminé » juste après */
const label = computed(() => (rest.finished ? 'Repos terminé' : formatClock(rest.remainingSeconds)))

async function keepAsDefault() {
  const duration = formatClock(rest.durationSeconds)
  try {
    await rest.saveAsDefault()
    toasts.show(`Repos par défaut : ${duration}`, 'success')
  } catch {
    toasts.show('La préférence n’a pas pu être enregistrée.', 'danger')
  }
}

async function setAutoStart(enabled: boolean) {
  try {
    await rest.setAutoStart(enabled)
  } catch {
    toasts.show('La préférence n’a pas pu être enregistrée.', 'danger')
  }
}
</script>

<template>
  <div class="rest" :class="{ 'rest--finished': rest.finished }">
    <p class="visually-hidden" role="status">
      {{ rest.finished ? 'Repos terminé' : '' }}
    </p>

    <template v-if="rest.isActive || rest.finished">
      <div class="rest__bar" :style="{ '--rest-progress': progress }" aria-hidden="true"></div>

      <div class="rest__row">
        <p class="rest__clock figure" :aria-label="`Repos restant : ${label}`">{{ label }}</p>

        <div class="rest__actions">
          <template v-if="!rest.finished">
            <BaseButton variant="secondary" @click="rest.adjust(-ADJUST_STEP_SECONDS)">
              −{{ ADJUST_STEP_SECONDS }} s
            </BaseButton>
            <BaseButton variant="secondary" @click="rest.adjust(ADJUST_STEP_SECONDS)">
              +{{ ADJUST_STEP_SECONDS }} s
            </BaseButton>
            <IconButton
              :label="rest.isPaused ? 'Reprendre le repos' : 'Mettre le repos en pause'"
              variant="secondary"
              @click="rest.isPaused ? rest.resume() : rest.pause()"
            >
              <Play v-if="rest.isPaused" :size="20" aria-hidden="true" />
              <Pause v-else :size="20" aria-hidden="true" />
            </IconButton>
          </template>
          <IconButton
            :label="rest.finished ? 'Masquer le repos terminé' : 'Arrêter le repos'"
            variant="secondary"
            @click="rest.finished ? rest.acknowledge() : rest.stop()"
          >
            <X :size="20" aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      <button
        v-if="!rest.finished && !rest.isDefaultDuration"
        type="button"
        class="rest__default"
        @click="keepAsDefault"
      >
        Garder {{ formatClock(rest.durationSeconds) }} comme repos par défaut
      </button>
    </template>

    <div v-else class="rest__row">
      <BaseButton variant="secondary" @click="rest.start()">
        <template #icon><Timer :size="18" aria-hidden="true" /></template>
        Repos {{ formatClock(rest.defaultSeconds) }}
      </BaseButton>
      <label class="rest__auto">
        <input
          type="checkbox"
          :checked="rest.autoStart"
          @change="setAutoStart(($event.target as HTMLInputElement).checked)"
        />
        Lancer le repos automatiquement
      </label>
    </div>
  </div>
</template>

<style scoped>
.rest {
  position: sticky;
  bottom: var(--space-2);
  z-index: var(--z-nav);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background-color: var(--color-surface-raised);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-overlay);
}

.rest--finished {
  border-color: var(--color-success);
}

.rest__bar {
  height: 4px;
  background-color: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.rest__bar::after {
  display: block;
  height: 100%;
  background-color: var(--color-accent);
  transform: scaleX(var(--rest-progress, 0));
  transform-origin: left;
  content: '';
}

.rest--finished .rest__bar::after {
  background-color: var(--color-success);
}

.rest__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.rest__clock {
  font-size: var(--font-size-2xl);
  color: var(--color-accent-text);
}

.rest--finished .rest__clock {
  font-size: var(--font-size-lg);
  color: var(--color-success);
}

.rest__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.rest__default {
  align-self: flex-start;
  padding: 0;
  font-size: var(--font-size-sm);
  color: var(--color-accent-text);
  text-decoration: underline;
  background: transparent;
  border: 0;
}

.rest__auto {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>

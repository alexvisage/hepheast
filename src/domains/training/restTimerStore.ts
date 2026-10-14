import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { useSessionStore } from '@/stores/session'

import { signalRestEnd } from './restSignal'

/**
 * Minuteur de repos (CDC §4.2).
 *
 * Le décompte repose sur une échéance absolue plutôt que sur un compteur
 * décrémenté : il reste juste même quand le navigateur ralentit les minuteurs
 * d'un onglet en arrière-plan. Le store étant global, le repos continue de
 * tourner en changeant d'écran.
 */

/** Pas d'ajustement pendant le repos */
export const ADJUST_STEP_SECONDS = 15
/** Repli quand l'utilisateur n'a pas encore de préférence enregistrée */
export const FALLBACK_REST_SECONDS = 90

const TICK_MS = 250

export const useRestTimerStore = defineStore('rest-timer', () => {
  const durationSeconds = ref(FALLBACK_REST_SECONDS)
  const endsAt = ref<number | null>(null)
  const pausedSeconds = ref<number | null>(null)
  const now = ref(Date.now())
  /** Le dernier repos est arrivé à son terme : à afficher et à annoncer */
  const finished = ref(false)

  let ticker: ReturnType<typeof setInterval> | undefined

  const isRunning = computed(() => endsAt.value !== null)
  const isPaused = computed(() => pausedSeconds.value !== null)
  const isActive = computed(() => isRunning.value || isPaused.value)

  const remainingSeconds = computed(() => {
    if (pausedSeconds.value !== null) return pausedSeconds.value
    if (endsAt.value === null) return 0
    return Math.max(0, (endsAt.value - now.value) / 1000)
  })

  const preferences = computed(() => useSessionStore().preferences)
  const defaultSeconds = computed(
    () => preferences.value?.defaultRestSeconds ?? FALLBACK_REST_SECONDS,
  )
  /** Préférence absente : le démarrage automatique est actif */
  const autoStart = computed(() => preferences.value?.autoRest !== false)
  const isDefaultDuration = computed(() => durationSeconds.value === defaultSeconds.value)

  function startTicker() {
    stopTicker()
    now.value = Date.now()
    ticker = setInterval(tick, TICK_MS)
  }

  function stopTicker() {
    clearInterval(ticker)
    ticker = undefined
  }

  function tick() {
    now.value = Date.now()
    if (endsAt.value !== null && now.value >= endsAt.value) finish()
  }

  function start(seconds: number = defaultSeconds.value) {
    durationSeconds.value = Math.max(1, Math.round(seconds))
    pausedSeconds.value = null
    finished.value = false
    endsAt.value = Date.now() + durationSeconds.value * 1000
    startTicker()
  }

  /** Démarrage après la validation d'une série ; respecte la préférence */
  function startIfAuto(): boolean {
    if (!autoStart.value) return false
    start()
    return true
  }

  function adjust(deltaSeconds: number) {
    if (pausedSeconds.value !== null) {
      pausedSeconds.value = Math.max(0, pausedSeconds.value + deltaSeconds)
      return
    }
    if (endsAt.value === null) return
    endsAt.value = Math.max(Date.now(), endsAt.value + deltaSeconds * 1000)
    durationSeconds.value = Math.max(1, durationSeconds.value + deltaSeconds)
    tick()
  }

  function pause() {
    if (endsAt.value === null) return
    pausedSeconds.value = remainingSeconds.value
    endsAt.value = null
    stopTicker()
  }

  function resume() {
    if (pausedSeconds.value === null) return
    endsAt.value = Date.now() + pausedSeconds.value * 1000
    pausedSeconds.value = null
    startTicker()
  }

  /** Repos interrompu par l'utilisateur : pas de signal */
  function stop() {
    endsAt.value = null
    pausedSeconds.value = null
    finished.value = false
    stopTicker()
  }

  /** Repos arrivé à son terme : vibration et bip */
  function finish() {
    endsAt.value = null
    pausedSeconds.value = null
    stopTicker()
    finished.value = true
    signalRestEnd()
  }

  /** Masque le message de fin, sans rien relancer */
  function acknowledge() {
    finished.value = false
  }

  /** Mémorise la durée en cours comme repos par défaut (CDC §4.2) */
  function saveAsDefault() {
    return useSessionStore().updatePreferences({ defaultRestSeconds: durationSeconds.value })
  }

  function setAutoStart(enabled: boolean) {
    return useSessionStore().updatePreferences({ autoRest: enabled })
  }

  return {
    durationSeconds,
    remainingSeconds,
    isRunning,
    isPaused,
    isActive,
    finished,
    autoStart,
    defaultSeconds,
    isDefaultDuration,
    start,
    startIfAuto,
    adjust,
    pause,
    resume,
    stop,
    acknowledge,
    saveAsDefault,
    setAutoStart,
  }
})

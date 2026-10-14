/**
 * Signal de fin de repos (CDC §4.2) : vibration et bip court.
 *
 * En salle, le téléphone est souvent posé ou dans la poche : le signal doit
 * passer sans regarder l'écran. Chaque canal est tenté indépendamment et
 * ignoré en silence s'il est indisponible (navigateur, appareil, permission).
 */

const BEEP_FREQUENCY_HZ = 880
const BEEP_DURATION_S = 0.18
const BEEP_GAIN = 0.2

/** Deux impulsions courtes : reconnaissable sans être agressif */
const VIBRATION_PATTERN = [120, 80, 120]

let context: AudioContext | undefined

function vibrate(): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  try {
    navigator.vibrate(VIBRATION_PATTERN)
  } catch {
    // Vibration refusée par l'appareil : le bip suffit
  }
}

function beep(): void {
  if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') return
  try {
    // Créé au premier signal : le minuteur a toujours été démarré par un geste
    context ??= new AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = BEEP_FREQUENCY_HZ
    gain.gain.setValueAtTime(BEEP_GAIN, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + BEEP_DURATION_S)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + BEEP_DURATION_S)
  } catch {
    // Audio indisponible ou bloqué : la vibration et l'écran restent
  }
}

export function signalRestEnd(): void {
  vibrate()
  beep()
}

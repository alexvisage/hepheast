import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastTone = 'info' | 'success' | 'warning' | 'danger'

export interface Toast {
  id: number
  message: string
  tone: ToastTone
}

const DEFAULT_DURATION_MS = 4000

/** Retours non bloquants après une action courante (CDC §9.3) */
export const useToastStore = defineStore('toasts', () => {
  const toasts = ref<Toast[]>([])
  let nextId = 1

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function show(message: string, tone: ToastTone = 'info', durationMs = DEFAULT_DURATION_MS) {
    const id = nextId++
    toasts.value = [...toasts.value, { id, message, tone }]
    if (durationMs > 0) setTimeout(() => dismiss(id), durationMs)
    return id
  }

  return { toasts, show, dismiss }
})

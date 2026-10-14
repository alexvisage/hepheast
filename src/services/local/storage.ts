/**
 * Stockage clé/valeur du navigateur, tolérant aux erreurs
 * (navigation privée, quota dépassé) avec repli en mémoire.
 */

const PREFIX = 'hephaest:'
const memory = new Map<string, string>()

function backend(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function readJson<T>(key: string, fallback: T): T {
  const fullKey = PREFIX + key
  let raw: string | null | undefined
  try {
    raw = backend()?.getItem(fullKey)
  } catch {
    raw = undefined
  }
  raw ??= memory.get(fullKey) ?? null
  if (raw === null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): void {
  const fullKey = PREFIX + key
  const raw = JSON.stringify(value)
  memory.set(fullKey, raw)
  try {
    backend()?.setItem(fullKey, raw)
  } catch {
    // Le repli mémoire suffit le temps de la session
  }
}

export function removeKey(key: string): void {
  const fullKey = PREFIX + key
  memory.delete(fullKey)
  try {
    backend()?.removeItem(fullKey)
  } catch {
    // ignoré
  }
}

/** Simule une latence réseau pour exercer les états de chargement */
export function latency(ms = 120): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, import.meta.env.MODE === 'test' ? 0 : ms))
}

export function createId(): string {
  return globalThis.crypto.randomUUID()
}

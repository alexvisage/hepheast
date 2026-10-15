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
  const storage = backend()
  let raw: string | null
  try {
    raw = storage ? storage.getItem(fullKey) : (memory.get(fullKey) ?? null)
  } catch {
    // Stockage inaccessible : on se replie sur la copie mémoire
    raw = memory.get(fullKey) ?? null
  }
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

/**
 * Efface toutes les données locales de l'application. Réservé aux outils de
 * développement (jeu de démonstration) : rien dans l'UI ne doit l'appeler.
 */
export function clearAll(): void {
  const storage = backend()
  try {
    const keys = storage ? Object.keys(storage).filter((key) => key.startsWith(PREFIX)) : []
    for (const key of keys) storage?.removeItem(key)
  } catch {
    // Stockage inaccessible : la copie mémoire suffit
  }
  for (const key of memory.keys()) {
    if (key.startsWith(PREFIX)) memory.delete(key)
  }
}

/** Simule une latence réseau pour exercer les états de chargement */
export function latency(ms = 120): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, import.meta.env.MODE === 'test' ? 0 : ms))
}

/**
 * Copie détachée de toute réactivité. `structuredClone` refuse les proxys de
 * Vue : le passage par JSON est le moyen sûr de figer ce qu'on enregistre,
 * et il écarte au passage les `undefined`, absents du stockage.
 */
export function detach<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function createId(): string {
  return globalThis.crypto.randomUUID()
}

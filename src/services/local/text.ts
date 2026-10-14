/** Normalise un texte pour la recherche : minuscules, sans accents ni espaces superflus */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

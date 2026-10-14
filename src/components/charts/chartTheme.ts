/**
 * Thème des graphiques, lu dans les design tokens (CDC §9.1).
 *
 * ECharts a besoin de couleurs réelles, pas de `var(--…)` : on lit donc les
 * custom properties au moment du rendu. Les valeurs de repli correspondent
 * aux tokens et servent quand le style n'est pas encore appliqué (tests,
 * rendu hors document).
 */

const FALLBACKS: Record<string, string> = {
  '--color-accent': '#c8794a',
  '--color-accent-text': '#e9a578',
  '--color-success': '#6fb3a4',
  '--color-warning': '#d4b45a',
  '--color-text': '#ece8e2',
  '--color-text-muted': '#a9afb7',
  '--color-border': '#31363d',
  '--color-surface-raised': '#262a2f',
  '--font-family': "'Archivo Variable', 'Archivo', system-ui, sans-serif",
}

export function token(name: string): string {
  if (typeof window === 'undefined') return FALLBACKS[name] ?? ''
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || (FALLBACKS[name] ?? '')
}

export interface ChartPalette {
  accent: string
  accentText: string
  success: string
  warning: string
  text: string
  textMuted: string
  border: string
  surface: string
  fontFamily: string
}

export function chartPalette(): ChartPalette {
  return {
    accent: token('--color-accent'),
    accentText: token('--color-accent-text'),
    success: token('--color-success'),
    warning: token('--color-warning'),
    text: token('--color-text'),
    textMuted: token('--color-text-muted'),
    border: token('--color-border'),
    surface: token('--color-surface-raised'),
    fontFamily: token('--font-family'),
  }
}

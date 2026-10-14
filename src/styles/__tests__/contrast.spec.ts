import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Vérifie que les associations texte / fond du design system respectent
 * les ratios de contraste WCAG 2.2 AA (4.5:1 pour le texte, 3:1 pour les
 * éléments graphiques et le texte large).
 */

const css = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8')

const raw = new Map<string, string>()
for (const [, name, value] of css.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
  if (name && value) raw.set(name, value.trim())
}

function resolve(name: string, depth = 0): string {
  const value = raw.get(name)
  if (!value || depth > 5) throw new Error(`Token inconnu : --${name}`)
  const ref = /^var\(--([\w-]+)\)$/.exec(value)
  return ref?.[1] ? resolve(ref[1], depth + 1) : value
}

function luminance(hex: string): number {
  const channels = (hex.replace('#', '').match(/.{2}/g) ?? []).map((c) => parseInt(c, 16) / 255)
  const [r = 0, g = 0, b = 0] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(foreground: string, background: string): number {
  const a = luminance(resolve(foreground))
  const b = luminance(resolve(background))
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

const TEXT = 4.5
const GRAPHIC = 3

const pairs: [foreground: string, background: string, minimum: number][] = [
  ['color-text', 'color-bg', TEXT],
  ['color-text', 'color-surface-raised', TEXT],
  ['color-text-muted', 'color-bg', TEXT],
  ['color-text-muted', 'color-surface-raised', TEXT],
  ['color-text-subtle', 'color-surface', TEXT],
  ['color-text-on-accent', 'color-accent', TEXT],
  ['color-text-on-accent', 'color-accent-hover', TEXT],
  ['color-accent-text', 'color-bg', TEXT],
  ['color-accent-text', 'color-accent-soft', TEXT],
  ['color-success', 'color-success-soft', TEXT],
  ['color-warning', 'color-warning-soft', TEXT],
  ['color-danger', 'color-danger-soft', TEXT],
  ['color-danger', 'color-surface', TEXT],
  ['color-accent', 'color-bg', GRAPHIC],
  ['color-focus', 'color-surface-raised', GRAPHIC],
  ['color-border-strong', 'color-bg', 1.5],
]

describe('design tokens — contrastes WCAG AA', () => {
  it.each(pairs)('%s sur %s ≥ %d:1', (foreground, background, minimum) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(minimum)
  })
})

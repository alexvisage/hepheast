import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import LineChart from '../LineChart.vue'
import { chartPalette, token } from '../chartTheme'

describe('LineChart', () => {
  it('rend un graphique SVG masqué aux lecteurs d’écran', () => {
    const wrapper = mount(LineChart, {
      props: { labels: ['14 oct.', '16 oct.'], values: [80, 82.5], unit: 'kg' },
      attachTo: document.body,
    })

    const chart = wrapper.get('.chart')
    expect(chart.attributes('aria-hidden')).toBe('true')
    expect(chart.attributes('role')).toBe('presentation')
    expect(chart.element.querySelector('svg')).not.toBeNull()
    wrapper.unmount()
  })

  it('accepte des trous dans la série sans planter', () => {
    const wrapper = mount(LineChart, {
      props: { labels: ['a', 'b', 'c'], values: [10, null, 30] },
      attachTo: document.body,
    })
    expect(wrapper.get('.chart').element.querySelector('svg')).not.toBeNull()
    wrapper.unmount()
  })
})

describe('thème des graphiques', () => {
  it('se replie sur les tokens quand le style n’est pas appliqué', () => {
    expect(token('--color-accent')).toMatch(/^#|rgb/)
    expect(token('--token-inexistant')).toBe('')
  })

  it('expose la palette attendue par les graphiques', () => {
    const palette = chartPalette()
    expect(Object.keys(palette)).toEqual([
      'accent',
      'accentText',
      'success',
      'warning',
      'text',
      'textMuted',
      'border',
      'surface',
      'fontFamily',
    ])
    expect(palette.fontFamily).toContain('Archivo')
  })
})

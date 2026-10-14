<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import { LineChart } from 'echarts/charts'
import { GridComponent, MarkPointComponent, TooltipComponent } from 'echarts/components'
import { init, use, type ECharts } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'

import { chartPalette } from './chartTheme'

/**
 * Courbe d'évolution (CDC §5.4), rendue par ECharts.
 *
 * Imports sélectifs : seuls la courbe, la grille, l'infobulle et le rendu SVG
 * sont embarqués. Le SVG reste net à tous les zooms et s'imprime proprement.
 *
 * Le graphique est **masqué aux lecteurs d'écran** : l'appelant fournit un
 * tableau équivalent, seule représentation fiable des valeurs (SCRUM-181).
 */
const props = withDefaults(
  defineProps<{
    /** Libellés de l'axe des abscisses, un par point */
    labels: string[]
    values: (number | null)[]
    /** Unité affichée dans l'infobulle et sur l'axe : « kg », « rép. »… */
    unit?: string
    seriesName?: string
    height?: number
  }>(),
  { unit: '', seriesName: 'Valeur', height: 260 },
)

const container = useTemplateRef<HTMLDivElement>('container')
let chart: ECharts | undefined

use([LineChart, GridComponent, TooltipComponent, MarkPointComponent, SVGRenderer])

function render() {
  if (!chart) return
  const palette = chartPalette()
  chart.setOption(
    {
      animation: false,
      textStyle: { fontFamily: palette.fontFamily, color: palette.textMuted },
      grid: { top: 16, right: 12, bottom: 24, left: 48, containLabel: true },
      tooltip: {
        trigger: 'axis',
        backgroundColor: palette.surface,
        borderColor: palette.border,
        textStyle: { color: palette.text },
        valueFormatter: (value: number) =>
          props.unit ? `${value.toLocaleString('fr-FR')} ${props.unit}` : `${value}`,
      },
      xAxis: {
        type: 'category',
        data: props.labels,
        axisLine: { lineStyle: { color: palette.border } },
        axisTick: { show: false },
        axisLabel: { color: palette.textMuted },
      },
      yAxis: {
        type: 'value',
        name: props.unit,
        nameTextStyle: { color: palette.textMuted, align: 'right' },
        splitLine: { lineStyle: { color: palette.border } },
        axisLabel: { color: palette.textMuted },
      },
      series: [
        {
          name: props.seriesName,
          type: 'line',
          data: props.values,
          // Les trous restent des trous : on ne relie pas deux séances distantes
          connectNulls: false,
          showSymbol: true,
          symbolSize: 7,
          lineStyle: { width: 2, color: palette.accent },
          itemStyle: { color: palette.accentText },
        },
      ],
    },
    { notMerge: true },
  )
}

function resize() {
  chart?.resize()
}

onMounted(() => {
  if (!container.value) return
  chart = init(container.value, undefined, { renderer: 'svg' })
  render()
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  chart?.dispose()
  chart = undefined
})

watch(() => [props.labels, props.values, props.unit], render)
</script>

<template>
  <div
    ref="container"
    class="chart"
    :style="{ height: `${height}px` }"
    role="presentation"
    aria-hidden="true"
  ></div>
</template>

<style scoped>
.chart {
  width: 100%;
}
</style>

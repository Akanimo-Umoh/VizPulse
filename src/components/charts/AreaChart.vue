<script setup lang="ts">
/**
 * AreaChart — shows a single stream's history as a filled area chart.
 * The `stream` prop determines which coin to display.
 * Parent can swap this by changing which stream it passes in.
 */
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { DataStream } from '../../types'
import { formatCurrency, formatChartTime } from '../../utils'
import { useDashboardStore } from '../../stores/dashboardStore'

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps<{ stream: DataStream }>()
const store = useDashboardStore()
const option = computed(() => {
  const isDark = store.controls.theme === 'dark'
  const textColor = isDark ? '#94a3b8' : '#64748b'
  const gridColor = isDark ? '#1e293b' : '#f1f5f9'

  return {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 150,
    animationEasing: 'linear' as const,

    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: isDark ? '#0f172a' : '#fff',
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      textStyle: { color: isDark ? '#e2e8f0' : '#1e293b', fontSize: 11 },
      formatter: (params: { axisValue: number; value: [number, number] }[]) => {
        const p = params[0]
        return `<div style="font-size:11px">
          <div style="color:#64748b">${formatChartTime(p?.axisValue ?? 0)}</div>
          <strong>${formatCurrency(p?.value[1] ?? 0)}</strong>
        </div>`
      },
    },

    grid: { top: 8, right: 8, bottom: 24, left: 72 },

    xAxis: {
      type: 'time' as const,
      show: true,
      axisLine:  { lineStyle: { color: gridColor } },
      splitLine: { show: false },
      axisLabel: {
        color: textColor,
        fontSize: 9,
        formatter: (val: number) => formatChartTime(val),
        showMaxLabel: true,
        showMinLabel: true,
        interval: 'auto',
      },
    },

    yAxis: {
      type: 'value' as const,
      axisLine:  { show: false },
      splitLine: { lineStyle: { color: gridColor, type: 'dashed' as const } },
      axisLabel: {
        color: textColor,
        fontSize: 9,
        formatter: (val: number) => formatCurrency(val, 0),
      },
      scale: true,
    },

    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        sampling: 'average',
        lineStyle: { color: props.stream.color, width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: props.stream.color + '55' },
              { offset: 1, color: props.stream.color + '00' },
            ],
          },
        },
        data: props.stream.data.map(p => [p.timestamp, p.value]),
      },
    ],
  }
})
</script>

<template>
  <div class="area-wrapper" :style="{ '--stream-color': stream.color }">
    <div class="area-header">
      <div class="area-dot" />
      <span class="area-name">{{ stream.name }}</span>
      <span class="area-badge">AREA</span>
    </div>
    <v-chart
      class="chart"
      :option="option"
      :autoresize="true"
      :update-options="{ notMerge: false, lazyUpdate: true }"
    />
  </div>
</template>

<style scoped>
.area-wrapper {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 2px solid var(--stream-color);
}

.area-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.area-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--stream-color);
}

.area-name {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  flex: 1;
  text-transform: uppercase;
}

.area-badge {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--badge-bg);
  color: var(--text-muted);
}

.chart {
  width: 100%;
  min-height: 140px;
}
</style>

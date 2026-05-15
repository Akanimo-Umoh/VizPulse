<script setup lang="ts">
/**
 * LineChart — renders a real-time multi-series line chart using ECharts.
 *
 * vue-echarts gives us a <v-chart> component. We pass it an `option` object
 * that describes the chart. When `option` changes, ECharts updates smoothly.
 *
 * We use `computed` so the option recalculates whenever the store data changes.
 */
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useDashboardStore } from '../../stores/dashboardStore'
import { formatCurrency, formatChartTime } from '../../utils'

// ECharts tree-shaking: only register what we use
use([LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer])

const store = useDashboardStore()

// shallowRef prevents Vue from deeply watching the ECharts instance (perf)
const option = computed(() => {
  const isDark = store.controls.theme === 'dark'
  const textColor   = isDark ? '#94a3b8' : '#64748b'
  const gridColor   = isDark ? '#1e293b' : '#f1f5f9'
  const bgColor     = 'transparent'

  const activeStreams = Object.values(store.streamDataInRange).filter(s =>
    store.controls.activeStreams.includes(s.id)
  )

  return {
    backgroundColor: bgColor,
    animation: true,
    animationDuration: 200,
    animationEasing: 'linear' as const,

    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: isDark ? '#0f172a' : '#fff',
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      textStyle: { color: isDark ? '#e2e8f0' : '#1e293b', fontSize: 12 },
      formatter: (params: { axisValue: number; seriesName: string; value: [number, number] }[]) => {
        const time = formatChartTime(params[0]?.axisValue ?? 0)
        const rows = params
          .map(p => `<div style="display:flex;justify-content:space-between;gap:16px">
            <span>${p.seriesName}</span>
            <strong>${formatCurrency(p.value[1])}</strong>
          </div>`)
          .join('')
        return `<div style="font-size:11px"><div style="color:#64748b;margin-bottom:4px">${time}</div>${rows}</div>`
      },
    },

    legend: {
      show: false, // We use our own MetricCards as the legend
    },

    grid: {
      top: 16, right: 16, bottom: 40, left: 80,
      containLabel: false,
    },

    xAxis: {
      type: 'time' as const,
      axisLine:  { lineStyle: { color: gridColor } },
      splitLine: { lineStyle: { color: gridColor } },
      axisLabel: {
        color: textColor,
        fontSize: 10,
        formatter: (val: number) => formatChartTime(val),
      },
    },

    yAxis: {
      type: 'value' as const,
      axisLine:  { show: false },
      splitLine: { lineStyle: { color: gridColor, type: 'dashed' as const } },
      axisLabel: {
        color: textColor,
        fontSize: 10,
        formatter: (val: number) => formatCurrency(val, 0),
      },
      scale: true, // auto-scales Y to the visible data range
    },

    series: activeStreams.map(stream => ({
      name: stream.name,
      type: 'line',
      smooth: true,
      symbol: 'none',         // no dots on data points — cleaner for real-time
      sampling: 'average',    // ECharts built-in downsampling for performance
      lineStyle: { color: stream.color, width: 2 },
      itemStyle: { color: stream.color },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: stream.color + '30' },
            { offset: 1, color: stream.color + '00' },
          ],
        },
      },
      data: stream.data.map(p => [p.timestamp, p.value]),
      z: 2,
    })),
  }
})
</script>

<template>
  <div class="chart-wrapper">
    <div class="chart-title">
      <span class="chart-label">PRICE HISTORY</span>
      <span class="chart-badge">LINE</span>
    </div>

    <div class="chart-body">
      <v-chart
        class="chart"
        :option="option"
        :autoresize="true"
        :update-options="{ notMerge: false, lazyUpdate: true }"
      />
    </div>
  </div>
</template>

<style scoped>
.chart-wrapper {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}

.chart-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.chart-badge {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--badge-bg);
  color: var(--text-muted);
}

.chart-body {
  flex: 1;
  min-height: 0;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 260px;
}
</style>

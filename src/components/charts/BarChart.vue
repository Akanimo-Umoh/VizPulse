<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useDashboardStore } from '../../stores/dashboardStore'
import { formatCurrency } from '../../utils'

use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

const store = useDashboardStore()
const option = computed(() => {
  const isDark = store.controls.theme === 'dark'
  const textColor = isDark ? '#94a3b8' : '#64748b'
  const gridColor = isDark ? '#1e293b' : '#f1f5f9'

  const activeStreams = Object.values(store.streams).filter(s =>
    store.controls.activeStreams.includes(s.id)
  )

  return {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 300,

    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: isDark ? '#0f172a' : '#fff',
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      textStyle: { color: isDark ? '#e2e8f0' : '#1e293b', fontSize: 12 },
      formatter: (params: { name: string; value: number; color: string }[]) =>
        params.map(p =>
          `<div style="display:flex;align-items:center;gap:8px">
            <span style="width:8px;height:8px;border-radius:50%;background:${p.color};display:inline-block"></span>
            <span>${p.name}</span>
            <strong>${formatCurrency(p.value)}</strong>
          </div>`
        ).join(''),
    },

    grid: { top: 16, right: 16, bottom: 50, left: 80 },

    xAxis: {
      type: 'category' as const,
      data: activeStreams.map(s => s.name),
      axisLine:  { lineStyle: { color: gridColor } },
      axisLabel: { color: textColor, fontSize: 10 },
      axisTick:  { show: false },
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
      scale: true,
    },

    series: [
      {
        type: 'bar',
        barMaxWidth: 48,
        borderRadius: [6, 6, 0, 0],
        data: activeStreams.map(s => ({
          value: s.currentValue,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: s.color },
                { offset: 1, color: s.color + '44' },
              ],
            },
          },
        })),
      },
    ],
  }
})
</script>

<template>
  <div class="chart-wrapper">
    <div class="chart-title">
      <span class="chart-label">CURRENT PRICES</span>
      <span class="chart-badge">BAR</span>
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
.chart-body { flex: 1; min-height: 0; }
.chart { width: 100%; height: 100%; min-height: 220px; }
</style>

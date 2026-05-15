<script setup lang="ts">
/**
 * MetricCard — displays a single live metric (current price, trend, 24h range).
 *
 * In Vue 3, <script setup> is the modern way to write components.
 * defineProps() is how you receive data from a parent component —
 * exactly like React props.
 */
import { computed } from 'vue'
import type { DataStream } from '../../types'
import { formatCurrency, formatPercent } from '../../utils'

const props = defineProps<{
  stream: DataStream
  active: boolean
}>()

const emit = defineEmits<{
  toggle: [id: string]
}>()

const changePercent = computed(() => {
  if (props.stream.previousValue === 0) return 0
  return ((props.stream.currentValue - props.stream.previousValue) / props.stream.previousValue) * 100
})

const trendClass = computed(() => ({
  'trend-up':   props.stream.trend === 'up',
  'trend-down': props.stream.trend === 'down',
  'inactive':   !props.active,
}))
</script>

<template>
  <div
    class="metric-card"
    :class="trendClass"
    :style="{ '--stream-color': stream.color }"
    @click="emit('toggle', stream.id)"
    role="button"
    :aria-pressed="active"
    :aria-label="`Toggle ${stream.name} stream`"
  >
    <!-- Glow accent bar -->
    <div class="accent-bar" />

    <div class="card-header">
      <div class="stream-dot" />
      <span class="stream-name">{{ stream.name }}</span>
      <span class="stream-symbol">{{ stream.unit }}</span>
    </div>

    <div class="card-value">
      {{ formatCurrency(stream.currentValue) }}
    </div>

    <div class="card-change" :class="stream.trend">
      <span class="trend-arrow">{{ stream.trend === 'up' ? '▲' : stream.trend === 'down' ? '▼' : '─' }}</span>
      {{ formatPercent(changePercent) }}
    </div>

    <div class="card-range">
      <span class="range-label">24H</span>
      <span class="range-low">{{ formatCurrency(stream.low24h) }}</span>
      <span class="range-sep">–</span>
      <span class="range-high">{{ formatCurrency(stream.high24h) }}</span>
    </div>

    <div class="active-indicator" v-if="active" />
  </div>
</template>

<style scoped>
.metric-card {
  position: relative;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  user-select: none;
}

.metric-card:hover {
  border-color: var(--stream-color);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

.metric-card.inactive {
  opacity: 0.45;
}

.accent-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--stream-color);
  border-radius: 12px 12px 0 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stream-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--stream-color);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

.stream-name {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  flex: 1;
}

.stream-symbol {
  font-size: 0.65rem;
  color: var(--text-muted);
  background: var(--badge-bg);
  padding: 2px 6px;
  border-radius: 4px;
}

.card-value {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.35rem;
  letter-spacing: -0.02em;
  transition: color 0.3s;
}

.trend-up .card-value   { color: #22c55e; }
.trend-down .card-value { color: #ef4444; }

.card-change {
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.card-change.up     { color: #22c55e; }
.card-change.down   { color: #ef4444; }
.card-change.stable { color: var(--text-muted); }

.trend-arrow { font-size: 0.65rem; }

.card-range {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.68rem;
  color: var(--text-muted);
}

.range-label {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
}

.range-sep { color: var(--border); }

.active-indicator {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  background: var(--stream-color);
  opacity: 0.4;
}
</style>

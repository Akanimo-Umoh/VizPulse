<script setup lang="ts">
import { useDashboardStore } from '../../stores/dashboardStore'
import type { DashboardControls } from '../../types'

const store = useDashboardStore()

const timeRanges: Array<{ label: string; value: DashboardControls['timeRange'] }> = [
  { label: '1M',  value: '1m'  },
  { label: '5M',  value: '5m'  },
  { label: '15M', value: '15m' },
  { label: '1H',  value: '1h'  },
]
</script>

<template>
  <div class="controls-bar">
    <!-- Connection status -->
    <div class="status-pill" :class="store.connectionStatus">
      <span class="status-dot" />
      <span class="status-text">{{ store.connectionStatus.toUpperCase() }}</span>
    </div>

    <!-- Divider -->
    <div class="divider" />

    <!-- Time range -->
    <div class="control-group">
      <span class="control-label">RANGE</span>
      <div class="range-buttons">
        <button
          v-for="range in timeRanges"
          :key="range.value"
          class="range-btn"
          :class="{ active: store.controls.timeRange === range.value }"
          @click="store.setTimeRange(range.value)"
        >
          {{ range.label }}
        </button>
      </div>
    </div>

    <!-- Divider -->
    <div class="divider" />

    <!-- Stream toggles -->
    <div class="control-group streams-group">
      <span class="control-label">STREAMS</span>
      <div class="stream-toggles">
        <button
          v-for="stream in store.streams"
          :key="stream.id"
          class="stream-toggle"
          :class="{ active: store.controls.activeStreams.includes(stream.id) }"
          :style="{ '--sc': stream.color }"
          @click="store.toggleStream(stream.id)"
        >
          {{ stream.name }}
        </button>
      </div>
    </div>

    <!-- Spacer -->
    <div class="spacer" />

    <!-- Pause / Resume -->
    <button
      class="pause-btn"
      :class="{ paused: store.controls.isPaused }"
      @click="store.togglePause()"
    >
      <span>{{ store.controls.isPaused ? '▶ RESUME' : '⏸ PAUSE' }}</span>
    </button>

    <!-- Theme toggle -->
    <button class="theme-btn" @click="store.toggleTheme()">
      {{ store.controls.theme === 'dark' ? '☀' : '🌙' }}
    </button>
  </div>
</template>

<style scoped>
.controls-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  flex-wrap: wrap;
}

.divider {
  width: 1px;
  height: 20px;
  background: var(--border);
  flex-shrink: 0;
}

.spacer { flex: 1; min-width: 0; }

/* Status pill */
.status-pill {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 0.62rem; font-weight: 700; letter-spacing: 0.1em;
  border: 1px solid transparent;
  white-space: nowrap;
  flex-shrink: 0;
}
.status-pill.connected    { background: rgba(34,197,94,0.12);  border-color: rgba(34,197,94,0.3);  color: #22c55e; }
.status-pill.connecting   { background: rgba(245,158,11,0.12); border-color: rgba(245,158,11,0.3); color: #f59e0b; }
.status-pill.disconnected { background: rgba(148,163,184,0.1); border-color: var(--border);        color: var(--text-muted); }
.status-pill.error        { background: rgba(239,68,68,0.12);  border-color: rgba(239,68,68,0.3);  color: #ef4444; }

.status-dot {
  width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0;
}
.status-pill.connected .status-dot { animation: blink 1.2s infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }

/* Control group */
.control-group { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
.control-label {
  font-size: 0.58rem; font-weight: 700; letter-spacing: 0.12em;
  color: var(--text-muted); white-space: nowrap;
}

/* Range buttons */
.range-buttons {
  display: flex; gap: 2px;
  background: var(--bg);
  border-radius: 8px;
  padding: 2px;
  border: 1px solid var(--border);
}
.range-btn {
  padding: 3px 9px;
  border: none; background: transparent;
  color: var(--text-secondary);
  font-size: 0.68rem; font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: 0.04em;
}
.range-btn:hover  { background: var(--hover-bg); color: var(--text-primary); }
.range-btn.active { background: var(--accent); color: #fff; }

/* Stream toggles */
.streams-group { flex-wrap: wrap; }
.stream-toggles { display: flex; gap: 4px; flex-wrap: wrap; }
.stream-toggle {
  padding: 3px 9px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.65rem; font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.stream-toggle:hover { border-color: var(--sc); color: var(--sc); }
.stream-toggle.active {
  background: color-mix(in srgb, var(--sc) 15%, transparent);
  border-color: var(--sc);
  color: var(--sc);
}

/* Pause btn */
.pause-btn {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 5px 12px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.68rem; font-weight: 700; letter-spacing: 0.06em;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}
.pause-btn:hover  { border-color: var(--accent); color: var(--accent); }
.pause-btn.paused { background: rgba(99,102,241,0.15); border-color: #6366f1; color: #6366f1; }

/* Theme btn */
.theme-btn {
  padding: 5px 9px;
  border: 1px solid var(--border);
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.15s;
  flex-shrink: 0;
  line-height: 1;
}
.theme-btn:hover { border-color: var(--accent); }

/* Responsive */
@media (max-width: 768px) {
  .divider       { display: none; }
  .streams-group { order: 10; width: 100%; }
  .spacer        { display: none; }
}
</style>

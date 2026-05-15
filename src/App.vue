<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useDashboardStore } from './stores/dashboardStore'
import { useDataStream } from './composables/useDataStream'
import { useTheme } from './composables/useTheme'
import MetricCard from './components/ui/MetricCard.vue'
import DashboardControls from './components/ui/DashboardControls.vue'
import ConnectionBanner from './components/ui/ConnectionBanner.vue'
import LineChart from './components/charts/LineChart.vue'
import BarChart from './components/charts/BarChart.vue'
import AreaChart from './components/charts/AreaChart.vue'
import ActivityFeed from './components/feed/ActivityFeed.vue'
import { STREAM_CONFIG } from './data/streamGenerator'

const store = useDashboardStore()
const { connect } = useDataStream()
useTheme()

onMounted(() => { connect() })

const areaStreams = computed(() =>
  STREAM_CONFIG.map(cfg => store.streamDataInRange[cfg.id]).filter(Boolean)
)

const clock = ref(new Date().toUTCString().slice(17, 25))
setInterval(() => { clock.value = new Date().toUTCString().slice(17, 25) }, 1000)
</script>

<template>
  <div class="app" :class="store.controls.theme">

    <!-- ── Header ── -->
    <header class="app-header">
      <div class="header-inner">
        <div class="header-brand">
          <div class="brand-logo">
            <span class="logo-dot" />
          </div>
          <div class="brand-text">
            <span class="brand-name">VizPulse</span>
            <span class="brand-sub">Real-Time Analytics</span>
          </div>
        </div>
        <div class="header-meta">
          <span class="clock">{{ clock }} UTC</span>
          <div class="header-badge" :class="store.connectionStatus">
            <span class="badge-dot" />
            <span>{{ store.connectionStatus === 'connected' ? 'LIVE' : store.connectionStatus.toUpperCase() }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- ── Main ── -->
    <main class="app-main">
      <div class="main-inner">

        <ConnectionBanner />
        <DashboardControls />

        <!-- Metric Cards -->
        <section class="metric-grid" aria-label="Live metric cards">
          <MetricCard v-for="stream in store.streams" :key="stream.id" :stream="stream"
            :active="store.controls.activeStreams.includes(stream.id)" @toggle="store.toggleStream" />
        </section>

        <!-- Line + Bar charts -->
        <section class="charts-row" aria-label="Primary charts">
          <div class="chart-main">
            <LineChart />
          </div>
          <div class="chart-side">
            <BarChart />
          </div>
        </section>

        <!-- Area charts grid -->
        <section class="area-grid" aria-label="Area charts">
          <AreaChart v-for="stream in areaStreams" :key="stream.id" :stream="stream" />
        </section>

        <!-- Activity Feed -->
        <section class="feed-section" aria-label="Activity feed">
          <ActivityFeed />
        </section>

      </div>
    </main>

    <!-- ── Footer ── -->
    <footer class="app-footer">
      <div class="footer-inner">
        <span>VizPulse · Stage 5A · Vue 3 + TypeScript + ECharts</span>
        <span>Data: Binance WebSocket API</span>
      </div>
    </footer>

  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

/* ── CSS Variables ── */
:root {
  --bg: #020817;
  --card-bg: #0b1120;
  --border: #1e293b;
  --hover-bg: #0f172a;
  --badge-bg: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #475569;
  --accent: #6366f1;
  --max-w: 80rem;
  /* 7xl = 1280px */
  font-family: 'Space Grotesk', sans-serif;
}

html.light {
  --bg: #f8fafc;
  --card-bg: #ffffff;
  --border: #e2e8f0;
  --hover-bg: #f1f5f9;
  --badge-bg: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --accent: #6366f1;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: var(--bg);
  color: var(--text-primary);
  min-height: 100vh;
  overflow-x: hidden;
}

/* ── App shell ── */
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ── Centered container used by header, main, footer ── */
.header-inner,
.main-inner,
.footer-inner {
  width: 100%;
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* ── Header ── */
.app-header {
  background: var(--card-bg);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.875rem;
  padding-bottom: 0.875rem;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 8px #fff8;
  animation: pulse-logo 2s infinite;
}

@keyframes pulse-logo {

  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.3);
    opacity: 0.7;
  }
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
}

.brand-sub {
  font-size: 0.6rem;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.clock {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.header-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  white-space: nowrap;
}

.header-badge.connected {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.header-badge.connecting {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.header-badge.disconnected {
  background: var(--badge-bg);
  color: var(--text-muted);
  border: 1px solid var(--border);
}

.header-badge.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.header-badge.connected .badge-dot {
  animation: blink-badge 1.2s infinite;
}

@keyframes blink-badge {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.2;
  }
}

/* ── Main ── */
.app-main {
  flex: 1;
  background: var(--bg);
}

.main-inner {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 1.25rem;
  padding-bottom: 1.5rem;
}

/* ── Metric cards ── */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
}

/* ── Line + Bar row ── */
.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  height: 100%;
}

.charts-row>* {
  min-width: 0;
}

.chart-main,
.chart-side {
  width: 100%;
  height: 320px;
}

/* ── Area charts ── */
.area-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.875rem;
}

.area-grid>* {
  min-width: 0;
  overflow: hidden;
  height: 200px;
}

/* ── Feed ── */
.feed-section {
  height: 400px;
}

/* ── Footer ── */
.app-footer {
  border-top: 1px solid var(--border);
  background: var(--card-bg);
}

.footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* ── Responsive: tablet (≤1024px) ── */
@media (max-width: 1024px) {
  .metric-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .charts-row {
    grid-template-columns: 1fr;
  }

  .chart-main {
    height: 300px;
    width: auto;
  }

  .chart-side {
    height: 280px;
  }

  .area-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .area-grid>* {
    height: 200px;
  }

  .feed-section {
    height: 380px;
  }
}

/* ── Responsive: large mobile (≤768px) ── */
@media (max-width: 768px) {

  .header-inner,
  .main-inner,
  .footer-inner {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .clock {
    display: none;
  }

  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .charts-row {
    grid-template-columns: 1fr;
  }

  .chart-main {
    height: 320px;
  }

  .chart-side {
    height: 320px;
  }

  .area-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .area-grid>* {
    height: 180px;
  }

  .feed-section {
    height: 360px;
  }

  .main-inner {
    gap: 1rem;
  }
}

/* ── Responsive: small mobile (≤480px) ── */
@media (max-width: 480px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }

  .area-grid {
    grid-template-columns: 1fr;
  }

  .area-grid>* {
    height: 160px;
  }

  .chart-main {
    height: 320px;
  }

  .chart-side {
    height: 320px;
  }

  .feed-section {
    height: 320px;
  }
}
</style>

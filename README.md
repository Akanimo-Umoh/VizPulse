# VizPulse — Real-Time Data Visualization Platform

> Stage 5A · Frontend Wizards · Vue 3 + TypeScript + ECharts

---

## Setup Instructions

```bash
pnpm install
pnpm dev        # development server → http://localhost:5173
pnpm build      # production build
pnpm preview    # preview production build
```

---

## Architecture

```
src/
├── components/
│   ├── charts/     # LineChart, BarChart, AreaChart
│   ├── ui/         # MetricCard, DashboardControls, ConnectionBanner
│   └── feed/       # ActivityFeed
├── composables/    # useDataStream (WebSocket), useTheme
├── stores/         # dashboardStore (Pinia)
├── types/          # TypeScript interfaces
├── utils/          # formatters, throttle helpers
└── data/           # streamGenerator (Binance config + mock fallback)
```

---

## State Management Strategy

**Pinia** is the single source of truth. All data flows in one direction:

```
WebSocket → useDataStream → store.ingestPayload() → Pinia → Components
```

- `streams` — full data history per coin, capped at 300 points to prevent memory leaks
- `streamDataInRange` — computed slice of history based on selected time range
- `feedItems` — live event log, capped at 200 entries

---

## Rendering Optimization

- `lazyUpdate: true` on ECharts — batches rapid updates into single render frames
- `sampling: 'average'` — ECharts auto-downsamples large datasets at render time
- `notMerge: false` — diff updates instead of full chart re-creation
- Hard caps on data arrays prevent unbounded memory growth
- All time-range filtering happens once in computed store properties

---

## Data Streaming Approach

**Primary:** Binance WebSocket (`wss://stream.binance.com:9443`) — free, no API key, real live crypto prices (BTC, ETH, BNB, SOL, ADA).

**Fallback:** Mock generator using a random-walk algorithm (±0.3% per tick, 1500ms interval) — activates automatically if WebSocket fails.

**Reconnection:** Exponential backoff — 2s → 4s → 8s → 16s → 30s (max). Mock stream runs during reconnect so UI is never empty.

**Security:** All incoming payloads are validated with `validateBinancePayload()` and sanitised with `sanitiseNumeric()` before touching state. Malformed data is silently dropped.

---

## Trade-offs

| Decision | Reason |
|---|---|
| ECharts over D3 | Faster to implement well; built-in downsampling and canvas renderer |
| Mock fallback | Keeps the app demo-able even without WebSocket access |
| 300-point cap | Prevents memory growth; a production app would offload to IndexedDB |
| Single Pinia store | Appropriate for this scale; larger apps would split by domain |
| No Web Workers | Kept architecture simple; would be added for a true trading terminal |

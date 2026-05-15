import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DataStream, FeedItem, DashboardControls, StreamPayload, ConnectionStatus } from '../types'
import { STREAM_CONFIG } from '../data/streamGenerator'
import { timeRangeMs, uid } from '../utils'

// Maximum data points kept per stream (prevents memory leaks)
const MAX_POINTS = 300

export const useDashboardStore = defineStore('dashboard', () => {
  // ─── State ───────────────────────────────────────────────────────────────

  const connectionStatus = ref<ConnectionStatus>('disconnected')
  const feedItems = ref<FeedItem[]>([])

  const controls = ref<DashboardControls>({
    isPaused: false,
    timeRange: '5m',
    activeStreams: STREAM_CONFIG.map(s => s.id),
    theme: 'dark',
  })

  // Build the initial streams map from config
  const streams = ref<Record<string, DataStream>>(
    Object.fromEntries(
      STREAM_CONFIG.map(cfg => [
        cfg.id,
        {
          id: cfg.id,
          name: cfg.name,
          color: cfg.color,
          unit: cfg.unit,
          data: [],
          currentValue: 0,
          previousValue: 0,
          trend: 'stable',
          high24h: 0,
          low24h: Infinity,
        } satisfies DataStream,
      ])
    )
  )

  // ─── Computed ─────────────────────────────────────────────────────────────

  /** Only the streams the user has toggled ON */
  const activeStreamList = computed(() =>
    Object.values(streams.value).filter(s =>
      controls.value.activeStreams.includes(s.id)
    )
  )

  /** Data points trimmed to the selected time range */
  const streamDataInRange = computed(() => {
    const cutoff = Date.now() - timeRangeMs(controls.value.timeRange)
    const result: Record<string, DataStream> = {}
    for (const [id, stream] of Object.entries(streams.value)) {
      result[id] = {
        ...stream,
        data: stream.data.filter(p => p.timestamp >= cutoff),
      }
    }
    return result
  })

  /** The 5 most recent feed items for a compact preview */
  const recentFeedItems = computed(() => feedItems.value.slice(0, 50))

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Ingest a validated stream payload into state.
   * Called once per ticker update from the WebSocket / mock generator.
   */
  function ingestPayload(payload: StreamPayload) {
    if (controls.value.isPaused) return

    const stream = streams.value[payload.streamId]
    if (!stream) return

    const prev = stream.currentValue

    // Update stream values
    stream.previousValue = prev
    stream.currentValue = payload.value
    stream.high24h = payload.high24h
    stream.low24h = payload.low24h
    stream.trend =
      payload.value > prev ? 'up' :
      payload.value < prev ? 'down' : 'stable'

    // Append new data point, cap at MAX_POINTS to prevent memory leak
    stream.data.push({ timestamp: payload.timestamp, value: payload.value })
    if (stream.data.length > MAX_POINTS) {
      stream.data.splice(0, stream.data.length - MAX_POINTS)
    }

    // Generate feed item for notable price moves (>0.3% change)
    const absPct = Math.abs(payload.changePercent)
    if (absPct > 0.3) {
      const feedItem: FeedItem = {
        id: uid(),
        timestamp: payload.timestamp,
        type: absPct > 1 ? 'error' : absPct > 0.5 ? 'warning' : 'info',
        message: `${stream.name} moved ${payload.changePercent > 0 ? '▲' : '▼'} ${Math.abs(payload.changePercent).toFixed(2)}% to $${payload.value.toFixed(2)}`,
        source: stream.name,
        value: payload.value,
        change: payload.changePercent,
      }
      // Prepend so newest is always first, cap at 200
      feedItems.value.unshift(feedItem)
      if (feedItems.value.length > 200) {
        feedItems.value.splice(200)
      }
    }
  }

  function setConnectionStatus(status: ConnectionStatus) {
    connectionStatus.value = status
  }

  function togglePause() {
    controls.value.isPaused = !controls.value.isPaused
  }

  function setTimeRange(range: DashboardControls['timeRange']) {
    controls.value.timeRange = range
  }

  function toggleStream(id: string) {
    const idx = controls.value.activeStreams.indexOf(id)
    if (idx === -1) {
      controls.value.activeStreams.push(id)
    } else if (controls.value.activeStreams.length > 1) {
      // Always keep at least one stream active
      controls.value.activeStreams.splice(idx, 1)
    }
  }

  function toggleTheme() {
    controls.value.theme = controls.value.theme === 'dark' ? 'light' : 'dark'
  }

  function addSystemFeedItem(message: string, type: FeedItem['type'] = 'info') {
    feedItems.value.unshift({
      id: uid(),
      timestamp: Date.now(),
      type,
      message,
      source: 'System',
    })
  }

  return {
    // state
    streams,
    connectionStatus,
    feedItems,
    controls,
    // computed
    activeStreamList,
    streamDataInRange,
    recentFeedItems,
    // actions
    ingestPayload,
    setConnectionStatus,
    togglePause,
    setTimeRange,
    toggleStream,
    toggleTheme,
    addSystemFeedItem,
  }
})

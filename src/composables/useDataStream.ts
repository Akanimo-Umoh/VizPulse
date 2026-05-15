import { ref, onUnmounted } from 'vue'
import { useDashboardStore } from '../stores/dashboardStore'
import { STREAM_CONFIG, generateMockPayload, validateBinancePayload, sanitiseNumeric } from '../data/streamGenerator'
import type { StreamPayload, BinanceTicker } from '../types'

/**
 * Binance sends a WebSocket PING FRAME every 20 seconds.
 * We must respond with a PONG FRAME (not a JSON message) within 60s or we get disconnected.
 * The browser WebSocket API handles ping/pong frames automatically at the protocol level,
 * so we do NOT need to send anything manually — the browser does it for us.
 *
 * What was breaking before:
 * - We were sending ws.send(JSON.stringify({ method: 'ping' })) — this is a JSON message,
 *   NOT a pong frame. It counted against the 5 msg/sec limit and did nothing useful.
 * - onerror + onclose both fired, scheduling two reconnect timers that cancelled each other.
 *
 * The correct approach per Binance docs:
 * - Use the combined stream URL (/stream?streams=...)
 * - Let the browser handle ping/pong at the protocol level automatically
 * - Only reconnect from onclose, never from onerror
 * - Handle the serverShutdown event gracefully
 */

const WS_URL =
  'wss://data-stream.binance.vision/stream?streams=' +
  STREAM_CONFIG.map(s => `${s.symbol.toLowerCase()}@ticker`).join('/')

// Fallback: raw single-stream on the same accessible host
const WS_URL_FALLBACK =
  'wss://data-stream.binance.vision/stream?streams=' +
  STREAM_CONFIG.map(s => `${s.symbol.toLowerCase()}@ticker`).join('/')

const RECONNECT_BASE_MS = 3000
const RECONNECT_MAX_MS  = 30000

export function useDataStream() {
  const store = useDashboardStore()

  let ws: WebSocket | null = null
  let mockInterval: ReturnType<typeof setInterval> | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let isIntentionalClose = false
  let useFallbackUrl = false   // try port 443 after first failure

  const reconnectAttempts = ref(0)
  const usingMock = ref(false)

  // ─── Mock fallback ──────────────────────────────────────────────────────

  function startMockStream() {
    if (mockInterval) return
    usingMock.value = true
    store.setConnectionStatus('connected')
    store.addSystemFeedItem('Using simulated data (WebSocket unavailable)', 'warning')
    // Seed immediately so charts aren't empty
    STREAM_CONFIG.forEach(cfg => store.ingestPayload(generateMockPayload(cfg.id)))
    mockInterval = setInterval(() => {
      STREAM_CONFIG.forEach(cfg => store.ingestPayload(generateMockPayload(cfg.id)))
    }, 1500)
  }

  function stopMockStream() {
    if (mockInterval) { clearInterval(mockInterval); mockInterval = null }
    usingMock.value = false
  }

  // ─── WebSocket ──────────────────────────────────────────────────────────

  function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

    isIntentionalClose = false
    store.setConnectionStatus('connecting')

    const url = useFallbackUrl ? WS_URL_FALLBACK : WS_URL
    store.addSystemFeedItem(
      `Connecting to Binance (port ${useFallbackUrl ? '443' : '9443'})…`,
      'info'
    )

    try {
      ws = new WebSocket(url)
    } catch {
      startMockStream()
      scheduleReconnect()
      return
    }

    /**
     * onopen — connection established successfully.
     * Reset counters, stop mock stream if it was running.
     */
    ws.onopen = () => {
      reconnectAttempts.value = 0
      stopMockStream()
      store.setConnectionStatus('connected')
      store.addSystemFeedItem('Connected to Binance WebSocket ✓', 'success')
    }

    /**
     * onmessage — a data frame arrived.
     * The browser already handled any ping/pong frames at protocol level before this fires.
     * We only see JSON data messages here.
     */
    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          stream?: string
          data?: unknown
          result?: unknown
          e?: string
        }

        // Handle serverShutdown — reconnect before we get kicked off
        if (msg.stream === '!serverShutdown' || msg.e === 'serverShutdown') {
          store.addSystemFeedItem('Binance server shutting down — reconnecting…', 'warning')
          ws?.close(1000)
          isIntentionalClose = false  // allow reconnect
          scheduleReconnect()
          return
        }

        // Ignore subscription confirmation responses (result: null)
        if ('result' in msg) return

        // Validate before touching any state
        if (!msg.data || !validateBinancePayload(msg.data)) return

        const ticker = msg.data as BinanceTicker
        const config = STREAM_CONFIG.find(s => s.symbol === ticker.s)
        if (!config) return

        const payload: StreamPayload = {
          streamId:      config.id,
          symbol:        ticker.s,
          timestamp:     Date.now(),
          value:         sanitiseNumeric(ticker.c),
          high24h:       sanitiseNumeric(ticker.h),
          low24h:        sanitiseNumeric(ticker.l),
          change:        sanitiseNumeric(ticker.p),
          changePercent: sanitiseNumeric(ticker.P),
        }

        store.ingestPayload(payload)
      } catch {
        // Silently drop malformed payloads — app must never crash on bad data
      }
    }

    /**
     * onerror — just log it. onclose ALWAYS fires right after onerror,
     * so we let onclose handle all reconnect logic to avoid double-scheduling.
     */
    ws.onerror = () => {
      store.setConnectionStatus('error')
    }

    /**
     * onclose — connection dropped. Reconnect unless we closed it intentionally.
     * Switch to fallback port after the first failure.
     */
    ws.onclose = (event) => {
      if (isIntentionalClose) return

      // Try the other port on next attempt
      useFallbackUrl = !useFallbackUrl

      store.addSystemFeedItem(
        `Connection closed (code ${event.code}). Switching to port ${useFallbackUrl ? '443' : '9443'}…`,
        'warning'
      )

      startMockStream()    // keep UI alive during reconnect
      scheduleReconnect()
    }
  }

  /**
   * Exponential backoff reconnect.
   * Delay doubles each attempt: 3s → 6s → 12s → 24s → 30s (max)
   */
  function scheduleReconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer)

    const delay = Math.min(
      RECONNECT_BASE_MS * Math.pow(2, reconnectAttempts.value),
      RECONNECT_MAX_MS
    )
    reconnectAttempts.value++

    store.addSystemFeedItem(
      `Reconnecting in ${Math.round(delay / 1000)}s… (attempt ${reconnectAttempts.value})`,
      'warning'
    )

    reconnectTimer = setTimeout(() => { connect() }, delay)
  }

  function disconnect() {
    isIntentionalClose = true
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
    stopMockStream()
    if (ws) { ws.close(1000); ws = null }
    store.setConnectionStatus('disconnected')
  }

  // Cleanup when the component using this composable is destroyed
  onUnmounted(() => { disconnect() })

  return { connect, disconnect, usingMock, reconnectAttempts }
}

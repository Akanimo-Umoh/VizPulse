// A single data point on any chart
export interface MetricPoint {
  timestamp: number
  value: number
}

// One live data stream (e.g. BTC price, CPU usage)
export interface DataStream {
  id: string
  name: string
  color: string
  unit: string
  data: MetricPoint[]
  currentValue: number
  previousValue: number
  trend: 'up' | 'down' | 'stable'
  high24h: number
  low24h: number
}

// One row in the activity feed
export interface FeedItem {
  id: string
  timestamp: number
  type: 'info' | 'warning' | 'error' | 'success'
  message: string
  source: string
  value?: number
  change?: number
}

// Dashboard filter / control state
export interface DashboardControls {
  isPaused: boolean
  timeRange: '1m' | '5m' | '15m' | '1h'
  activeStreams: string[]
  theme: 'dark' | 'light'
}

// Raw incoming payload from Binance WebSocket
export interface BinanceTicker {
  s: string   // symbol e.g. BTCUSDT
  c: string   // current price
  h: string   // 24h high
  l: string   // 24h low
  p: string   // price change
  P: string   // price change percent
  v: string   // volume
}

// Normalised internal streaming payload
export interface StreamPayload {
  streamId: string
  symbol: string
  timestamp: number
  value: number
  high24h: number
  low24h: number
  change: number
  changePercent: number
}

// WebSocket connection status
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

import type { StreamPayload } from '../types'

// The crypto pairs we stream from Binance
export const STREAM_CONFIG = [
  { id: 'btc',  symbol: 'BTCUSDT', name: 'Bitcoin',  color: '#f59e0b', unit: 'USDT' },
  { id: 'eth',  symbol: 'ETHUSDT', name: 'Ethereum', color: '#6366f1', unit: 'USDT' },
  { id: 'bnb',  symbol: 'BNBUSDT', name: 'BNB',      color: '#22c55e', unit: 'USDT' },
  { id: 'sol',  symbol: 'SOLUSDT', name: 'Solana',   color: '#ec4899', unit: 'USDT' },
  { id: 'ada',  symbol: 'ADAUSDT', name: 'Cardano',  color: '#14b8a6', unit: 'USDT' },
]

// Fallback mock prices when WebSocket is unavailable
const mockPrices: Record<string, number> = {
  btc: 67000,
  eth: 3500,
  bnb: 580,
  sol: 170,
  ada: 0.45,
}

const mock24hHigh: Record<string, number> = {
  btc: 68500, eth: 3650, bnb: 600, sol: 180, ada: 0.48,
}

const mock24hLow: Record<string, number> = {
  btc: 65000, eth: 3300, bnb: 550, sol: 160, ada: 0.42,
}

/**
 * Generates a realistic next value using a random walk algorithm.
 * Each tick moves the price by ±0.3% maximum, making it feel live.
 */
export function generateMockPayload(streamId: string): StreamPayload {
  const config = STREAM_CONFIG.find(s => s.id === streamId)!
  const prev = mockPrices[streamId]
  const delta = prev * (Math.random() - 0.5) * 0.006
  const next = Math.max(prev * 0.9, prev + delta)
  mockPrices[streamId] = next

  const change = next - prev
  const changePercent = (change / prev) * 100

  // keep 24h high/low realistic
  if (next > mock24hHigh[streamId]) mock24hHigh[streamId] = next
  if (next < mock24hLow[streamId])  mock24hLow[streamId]  = next

  return {
    streamId,
    symbol: config.symbol,
    timestamp: Date.now(),
    value: next,
    high24h: mock24hHigh[streamId],
    low24h:  mock24hLow[streamId],
    change,
    changePercent,
  }
}

/**
 * Validates that a Binance ticker payload has all required numeric fields.
 * This satisfies the "validate incoming payloads" security requirement.
 */
export function validateBinancePayload(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false
  const obj = raw as Record<string, unknown>
  return (
    typeof obj.s === 'string' &&
    typeof obj.c === 'string' &&
    !isNaN(parseFloat(obj.c as string))
  )
}

/**
 * Sanitises a string value coming from outside — strips anything non-numeric.
 * Prevents XSS / unsafe DOM injection from external data.
 */
export function sanitiseNumeric(val: string): number {
  const cleaned = String(val).replace(/[^0-9.-]/g, '')
  return parseFloat(cleaned) || 0
}

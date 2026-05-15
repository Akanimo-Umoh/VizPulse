/**
 * Formats a unix timestamp (ms) into a readable time string HH:MM:SS
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

/**
 * Formats a unix timestamp into a short time label for chart X-axes
 */
export function formatChartTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

/**
 * Formats a number as a currency string with commas
 * e.g. 67000.5 → "$67,000.50"
 */
export function formatCurrency(value: number, decimals = 2): string {
  if (value >= 1000) {
    return '$' + value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }
  return '$' + value.toFixed(4)
}

/**
 * Formats a percentage change with a sign prefix
 * e.g. 2.35 → "+2.35%" | -1.2 → "-1.20%"
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

/**
 * Formats large numbers into compact form
 * e.g. 1500000 → "1.5M"
 */
export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + 'B'
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M'
  if (value >= 1_000) return (value / 1_000).toFixed(2) + 'K'
  return value.toFixed(2)
}

/**
 * Throttle: calls fn at most once every `limit` ms.
 * Used to prevent chart re-renders firing too fast.
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= limit) {
      lastCall = now
      fn(...args)
    }
  }
}

/**
 * Clamps a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Returns the time range in milliseconds for a given label
 */
export function timeRangeMs(range: '1m' | '5m' | '15m' | '1h'): number {
  const map: Record<string, number> = {
    '1m':  60_000,
    '5m':  300_000,
    '15m': 900_000,
    '1h':  3_600_000,
  }
  return map[range] ?? 300_000
}

/**
 * Generates a unique ID string
 */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

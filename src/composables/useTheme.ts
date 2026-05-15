/**
 * useTheme — applies dark/light class to <html> and persists preference.
 */
import { watch } from 'vue'
import { useDashboardStore } from '../stores/dashboardStore'

export function useTheme() {
  const store = useDashboardStore()

  function applyTheme(theme: 'dark' | 'light') {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(theme)
    localStorage.setItem('vd-theme', theme)
  }

  // Read saved preference on first load
  const saved = localStorage.getItem('vd-theme') as 'dark' | 'light' | null
  if (saved) {
    store.controls.theme = saved
  }
  applyTheme(store.controls.theme)

  // React to toggle changes from the store
  watch(() => store.controls.theme, applyTheme)

  return { applyTheme }
}

<script setup lang="ts">
/**
 * ActivityFeed — live-updating table of notable price events.
 *
 * Key Vue concept here: v-for is Vue's equivalent of .map() in JSX.
 * :key tells Vue how to track each item for efficient DOM updates.
 */
import { ref, computed } from 'vue'
import { useDashboardStore } from '../../stores/dashboardStore'
import { formatTime, formatCurrency, formatPercent } from '../../utils'
import type { FeedItem } from '../../types'

const store = useDashboardStore()

const searchQuery = ref('')
const filterType = ref<FeedItem['type'] | 'all'>('all')

const filteredFeed = computed(() => {
  let items = store.recentFeedItems

  if (filterType.value !== 'all') {
    items = items.filter(i => i.type === filterType.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    items = items.filter(i =>
      i.message.toLowerCase().includes(q) ||
      i.source.toLowerCase().includes(q)
    )
  }

  return items
})

const typeLabel: Record<FeedItem['type'], string> = {
  info:    'INFO',
  warning: 'WARN',
  error:   'CRIT',
  success: 'OK',
}
</script>

<template>
  <div class="feed-wrapper">
    <div class="feed-header">
      <span class="feed-title">ACTIVITY FEED</span>
      <span class="feed-count">{{ store.feedItems.length }} events</span>
    </div>

    <!-- Search + filter controls -->
    <div class="feed-controls">
      <input
        v-model="searchQuery"
        class="feed-search"
        placeholder="Search events…"
        aria-label="Search activity feed"
      />
      <div class="feed-filters">
        <button
          v-for="type in (['all', 'info', 'warning', 'error', 'success'] as const)"
          :key="type"
          class="filter-btn"
          :class="[type, { active: filterType === type }]"
          @click="filterType = type"
        >
          {{ type === 'all' ? 'ALL' : typeLabel[type] }}
        </button>
      </div>
    </div>

    <!-- Feed table -->
    <div class="feed-scroll" role="log" aria-live="polite" aria-label="Live activity feed">
      <TransitionGroup name="feed-item" tag="div" class="feed-list">
        <div
          v-for="item in filteredFeed"
          :key="item.id"
          class="feed-row"
          :class="item.type"
        >
          <span class="feed-type" :class="item.type">{{ typeLabel[item.type] }}</span>
          <span class="feed-time">{{ formatTime(item.timestamp) }}</span>
          <span class="feed-source">{{ item.source }}</span>
          <span class="feed-message">{{ item.message }}</span>
          <span class="feed-value" v-if="item.value">
            {{ formatCurrency(item.value) }}
          </span>
          <span
            class="feed-change"
            :class="(item.change ?? 0) >= 0 ? 'up' : 'down'"
            v-if="item.change !== undefined"
          >
            {{ formatPercent(item.change ?? 0) }}
          </span>
        </div>
      </TransitionGroup>

      <div v-if="filteredFeed.length === 0" class="feed-empty">
        <span>No events match your filter.</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feed-wrapper {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  height: 100%;
  overflow: hidden;
}

.feed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.feed-title {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.feed-count {
  font-size: 0.65rem;
  color: var(--text-muted);
  background: var(--badge-bg);
  padding: 2px 8px;
  border-radius: 10px;
}

.feed-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.feed-search {
  width: 100%;
  padding: 6px 10px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.78rem;
  outline: none;
  transition: border-color 0.15s;
}

.feed-search:focus { border-color: var(--accent); }
.feed-search::placeholder { color: var(--text-muted); }

.feed-filters {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  background: var(--badge-bg);
  color: var(--text-muted);
  transition: all 0.12s;
}

.filter-btn:hover { opacity: 0.8; }
.filter-btn.active.all     { background: rgba(99,102,241,0.2); border-color: #6366f1; color: #6366f1; }
.filter-btn.active.info    { background: rgba(99,102,241,0.15); border-color: #6366f1; color: #6366f1; }
.filter-btn.active.warning { background: rgba(245,158,11,0.15); border-color: #f59e0b; color: #f59e0b; }
.filter-btn.active.error   { background: rgba(239,68,68,0.15); border-color: #ef4444; color: #ef4444; }
.filter-btn.active.success { background: rgba(34,197,94,0.15); border-color: #22c55e; color: #22c55e; }

.feed-scroll {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

.feed-list { display: flex; flex-direction: column; gap: 2px; }

.feed-row {
  display: grid;
  grid-template-columns: 36px 68px 72px 1fr auto auto;
  min-width: 0;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  transition: background 0.1s;
  border-left: 2px solid transparent;
}

.feed-row:hover            { background: var(--hover-bg); }
.feed-row.error            { border-left-color: #ef4444; }
.feed-row.warning          { border-left-color: #f59e0b; }
.feed-row.success          { border-left-color: #22c55e; }
.feed-row.info             { border-left-color: #6366f1; }

.feed-type {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-align: center;
  padding: 2px 4px;
  border-radius: 3px;
}

.feed-type.error   { background: rgba(239,68,68,0.15); color: #ef4444; }
.feed-type.warning { background: rgba(245,158,11,0.15); color: #f59e0b; }
.feed-type.success { background: rgba(34,197,94,0.15); color: #22c55e; }
.feed-type.info    { background: rgba(99,102,241,0.15); color: #6366f1; }

.feed-time    { color: var(--text-muted); font-family: monospace; font-size: 0.68rem; white-space: nowrap; }
.feed-source  { color: var(--text-secondary); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.feed-message { color: var(--text-primary); }
.feed-value   { color: var(--text-secondary); font-family: monospace; white-space: nowrap; }

.feed-change       { font-weight: 600; white-space: nowrap; font-size: 0.68rem; }
.feed-change.up    { color: #22c55e; }
.feed-change.down  { color: #ef4444; }

.feed-empty {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
  font-size: 0.8rem;
}

/* Responsive feed row */
@media (max-width: 600px) {
  .feed-row {
    grid-template-columns: 36px 1fr auto;
    grid-template-rows: auto auto;
  }
  .feed-time   { display: none; }
  .feed-source { display: none; }
  .feed-value  { display: none; }
}

/* TransitionGroup animation — items slide in from top when added */
.feed-item-enter-active { transition: all 0.25s ease; }
.feed-item-enter-from   { opacity: 0; transform: translateY(-12px); }
.feed-item-leave-active { transition: all 0.2s ease; position: absolute; }
.feed-item-leave-to     { opacity: 0; }
</style>

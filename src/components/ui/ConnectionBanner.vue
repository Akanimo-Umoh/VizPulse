<script setup lang="ts">
import { useDashboardStore } from '../../stores/dashboardStore'

const store = useDashboardStore()
</script>

<template>
  <Transition name="banner">
    <div
      v-if="store.connectionStatus === 'error' || store.connectionStatus === 'connecting'"
      class="connection-banner"
      :class="store.connectionStatus"
      role="alert"
    >
      <span class="banner-icon">{{ store.connectionStatus === 'error' ? '⚠' : '⟳' }}</span>
      <span v-if="store.connectionStatus === 'connecting'">Connecting to live data stream…</span>
      <span v-else>Connection lost — using simulated data. Reconnecting…</span>
    </div>
  </Transition>
</template>

<style scoped>
.connection-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 500;
}

.connection-banner.connecting {
  background: rgba(245,158,11,0.12);
  border: 1px solid rgba(245,158,11,0.3);
  color: #f59e0b;
}

.connection-banner.error {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.25);
  color: #ef4444;
}

.banner-icon { font-size: 1rem; }

.banner-enter-active, .banner-leave-active { transition: all 0.3s ease; }
.banner-enter-from, .banner-leave-to { opacity: 0; transform: translateY(-8px); }
</style>

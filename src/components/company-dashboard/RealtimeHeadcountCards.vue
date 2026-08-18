<script setup>
import { computed } from 'vue'
import { useHrAnalyticsStore } from '@/stores/hrAnalytics.store'

const store = useHrAnalyticsStore()

const headcount = computed(() => store.realtimeHeadcount ?? {})
const loading = computed(() => store.loadingHeadcount)
const error = computed(() => store.errorHeadcount)
</script>

<template>
  <div class="space-y-2">
    <div v-if="error" class="text-sm text-red-500">{{ error }}</div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex items-center justify-between">
        <div>
          <div class="text-xs text-slate-400">{{ $t('companyDashboard.presentNow') }}</div>
          <div class="text-2xl font-bold text-khubrat-blue dark:text-white">{{ loading ? $t('common.emDash') : (headcount.present_now ?? 0) }}</div>
        </div>
        <div class="ml-4 flex items-center">
          <span class="w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-md" aria-hidden="true"></span>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex items-center justify-between">
        <div>
          <div class="text-xs text-slate-400">{{ $t('companyDashboard.lateToday') }}</div>
          <div class="text-2xl font-bold text-slate-700 dark:text-slate-100">{{ loading ? $t('common.emDash') : (headcount.late_today ?? 0) }}</div>
        </div>
        <div class="ml-4 flex items-center">
          <span class="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-md" aria-hidden="true"></span>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex items-center justify-between">
        <div>
          <div class="text-xs text-slate-400">{{ $t('companyDashboard.onLeaveToday') }}</div>
          <div class="text-2xl font-bold text-slate-700 dark:text-slate-100">{{ loading ? $t('common.emDash') : (headcount.on_leave_today ?? 0) }}</div>
        </div>
        <div class="ml-4 flex items-center">
          <span class="w-3 h-3 rounded-full bg-slate-400 animate-pulse shadow-md" aria-hidden="true"></span>
        </div>
      </div>
    </div>

    <div class="text-xs text-slate-400 mt-2">{{ $t('companyDashboard.lastUpdate') }} <span class="font-medium text-slate-600 dark:text-slate-300">{{ headcount.timestamp ?? $t('common.emDash') }}</span></div>
  </div>
</template>
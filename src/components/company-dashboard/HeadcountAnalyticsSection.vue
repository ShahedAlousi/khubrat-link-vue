<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useHrAnalyticsStore } from '@/stores/hrAnalytics.store'
import RealtimeHeadcountCards from '@/components/company-dashboard/RealtimeHeadcountCards.vue'
import DailyVerificationGauge from '@/components/company-dashboard/DailyVerificationGauge.vue'
import TurnoverAreaChart from '@/components/company-dashboard/TurnoverAreaChart.vue'
import DemographicsBreakdown from '@/components/company-dashboard/DemographicsBreakdown.vue'
import DepartmentBudgetsBarChart from '@/components/company-dashboard/DepartmentBudgetsBarChart.vue'
import PerformanceDistributionChart from '@/components/company-dashboard/PerformanceDistributionChart.vue'

const store = useHrAnalyticsStore()

onMounted(() => {
  store.fetchRealtimeHeadcount()
  store.startRealtimePolling()
  store.fetchDailyVerificationRate()
  store.fetchTurnoverRate()
  store.fetchDemographics()
  store.fetchDepartmentBudgets()
  store.fetchPerformanceDistribution()
})

onUnmounted(() => {
  store.stopRealtimePolling()
})
</script>

<template>
  <section class="space-y-6">
    <!-- Section Header -->
    <header class="border-b border-slate-200 dark:border-slate-800 pb-3">
      <h2 class="text-base font-bold text-slate-800 dark:text-slate-100">
        Workforce & Headcount Analytics
      </h2>
      <p class="text-xs text-slate-400 mt-0.5">
        Real-time tracking of employee headcount, verification status, and turnover metrics.
      </p>
    </header>

    <!-- Top KPI Cards -->
    <RealtimeHeadcountCards />

    <!-- Visualizations Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      <!-- Daily Verification Gauge (1/3 Width on Large Screens) -->
      <div class="lg:col-span-1">
        <DailyVerificationGauge />
      </div>

      <!-- Turnover Area Chart (2/3 Width on Large Screens) -->
      <div class="lg:col-span-2">
        <TurnoverAreaChart />
      </div>
    </div>

    <!-- Demographics & Department Budgets Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      <div class="lg:col-span-1">
        <DemographicsBreakdown />
      </div>
      <div class="lg:col-span-2">
        <DepartmentBudgetsBarChart />
      </div>
    </div>

    <!-- Performance Distribution -->
    <PerformanceDistributionChart />

 </section>
</template>
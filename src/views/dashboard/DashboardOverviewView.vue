<script setup>
import { computed, onMounted } from 'vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import MonthlySubscriptionChart from '@/components/dashboard/MonthlySubscriptionChart.vue'
import StatusDistributionChart from '@/components/dashboard/StatusDistributionChart.vue'
import RecentCompaniesList from '@/components/dashboard/RecentCompaniesList.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { useCompaniesStore } from '@/stores/companies.store'
import { formatCurrency } from '@/utils/format'

const companiesStore = useCompaniesStore()

onMounted(() => {
  companiesStore.fetchStats()
})

const summary = computed(() => companiesStore.stats?.summary || {})
const distribution = computed(() => companiesStore.stats?.status_distribution || {})
const analytics = computed(() => companiesStore.stats?.monthly_subscription_analytics || [])
const recentPlatforms = computed(() => companiesStore.stats?.latest_registered_platforms || [])
</script>

<template>
  <section class="space-y-8">
    <LoadingSpinner v-if="companiesStore.statsLoading && !companiesStore.stats" label="Loading dashboard…" full-height />

    <BaseAlert v-else-if="companiesStore.error && !companiesStore.stats" variant="error">
      {{ companiesStore.error }}
    </BaseAlert>

    <template v-else>
      <!-- Top counters -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total Revenue"
          :value="formatCurrency(summary.total_revenue)"
          :hint="summary.monthly_revenue ? `${formatCurrency(summary.monthly_revenue)} this month` : ''"
          icon="fa-wallet"
          icon-wrap-class="bg-khubrat-blue/10 dark:bg-khubrat-blue/30 text-khubrat-blue dark:text-khubrat-goldLight"
        />
        <StatCard
          label="Total Subscriptions"
          :value="summary.total_subscriptions ?? 0"
          :hint="summary.new_companies_this_month ? `+${summary.new_companies_this_month} new companies` : ''"
          icon="fa-building-circle-check"
          icon-wrap-class="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="New Companies (Month)"
          :value="summary.new_companies_this_month ?? 0"
          hint="Registered this calendar month"
          hint-class="text-amber-500"
          icon="fa-cubes-stacked"
          icon-wrap-class="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm lg:col-span-2">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h4 class="text-md font-bold text-khubrat-blue dark:text-white">Monthly Subscription Analytics</h4>
              <p class="text-xs text-slate-400">Monthly signup trends and platform conversions</p>
            </div>
          </div>
          <MonthlySubscriptionChart :analytics="analytics" />
        </div>

        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div class="flex flex-col mb-6">
            <h4 class="text-md font-bold text-khubrat-blue dark:text-white">Company Status Distribution</h4>
            <p class="text-xs text-slate-400">Active, Frozen, and At-Risk accounts</p>
          </div>
          <StatusDistributionChart :distribution="distribution" />
          <div class="mt-4 flex justify-around text-xs font-bold border-t border-slate-100 dark:border-slate-700 pt-4">
            <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-emerald-500"></span> Active</div>
            <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-amber-500"></span> Frozen</div>
            <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-rose-500"></span> At-Risk</div>
          </div>
        </div>
      </div>

      <RecentCompaniesList :platforms="recentPlatforms" />
    </template>
  </section>
</template>

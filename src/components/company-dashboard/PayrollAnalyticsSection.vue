<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import PayrollCostTrendChart from '@/components/company-dashboard/PayrollCostTrendChart.vue'
import PayrollDistributionChart from '@/components/company-dashboard/PayrollDistributionChart.vue'
import { usePayrollAnalyticsStore } from '@/stores/payrollAnalytics.store'
import { formatCurrency } from '@/utils/format'

const store = usePayrollAnalyticsStore()
const { t, tm, locale } = useI18n()

const monthNames = computed(() => {
  void locale.value
  const names = tm('months.long')
  return Array.isArray(names) ? names : []
})

const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, i) => {
    const y = current - i
    return { value: y, label: String(y) }
  })
})

const monthOptions = computed(() => monthNames.value.map((label, i) => ({ value: i + 1, label })))

const periodLabel = computed(() => {
  const month = store.summary?.month ?? store.filters.month
  const year = store.summary?.year ?? store.filters.year
  return `${monthNames.value[month - 1] || ''} ${year}`
})

const momHint = computed(() => {
  const pct = store.costMomPercent
  if (pct === null || Number.isNaN(pct)) return null
  const rounded = Math.abs(pct).toFixed(0)
  const sign = pct >= 0 ? '+' : '−'
  return {
    text: `${sign}${t('payroll.vsPrevious', { n: rounded })}`,
    positive: pct >= 0
  }
})

const sparklinePoints = computed(() => {
  const values = store.monthlyCostTrend.map((r) => Number(r.total_cost) || 0)
  if (values.length < 2) return ''
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const w = 72
  const h = 28
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / range) * (h - 4) - 2
      return `${x},${y}`
    })
    .join(' ')
})

const savingsPositive = computed(() => store.totalSavings >= 0)

async function load() {
  await store.fetchAnalytics({
    year: store.filters.year,
    month: store.filters.month
  })
}

function onYearChange(value) {
  store.setFilters({ year: Number(value) })
  load().catch(() => {})
}

function onMonthChange(value) {
  store.setFilters({ month: Number(value) })
  load().catch(() => {})
}

function exportReport() {
  if (!store.analytics) return
  const payload = {
    exported_at: new Date().toISOString(),
    filters: { ...store.filters },
    ...store.analytics
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `payroll-analytics-${store.filters.year}-${String(store.filters.month).padStart(2, '0')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  load().catch(() => {})
})
</script>

<template>
  <section class="space-y-6">
    <!-- Section header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-black text-khubrat-blue dark:text-white">
          {{ $t('payroll.analyticsTitle') }}
        </h2>
        <p class="text-xs text-slate-400 mt-0.5">{{ $t('payroll.analyticsSubtitle') }}</p>
      </div>

      <div class="flex flex-wrap items-end gap-3">
        <BaseSelect
          :model-value="store.filters.year"
          :label="$t('payroll.year')"
          :options="yearOptions"
          class="w-32"
          @update:model-value="onYearChange"
        />
        <BaseSelect
          :model-value="store.filters.month"
          :label="$t('payroll.month')"
          :options="monthOptions"
          class="w-40"
          @update:model-value="onMonthChange"
        />
      </div>
    </div>

    <LoadingSpinner v-if="store.loading && !store.analytics" :label="$t('payroll.loadingAnalytics')" />

    <BaseAlert v-else-if="store.error && !store.analytics" variant="error">
      {{ store.error }}
    </BaseAlert>

    <template v-else-if="store.summary">
      <!-- KPI cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <!-- 1 Net -->
        <article
          class="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 overflow-hidden"
        >
          <span
            class="absolute top-3 end-3 w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] font-black text-slate-500 flex items-center justify-center"
          >1</span>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ $t('payroll.netPayroll') }}</p>
          <div class="mt-2 flex items-end justify-between gap-3">
            <h3 class="text-2xl font-black text-khubrat-blue dark:text-white tabular-nums">
              {{ formatCurrency(store.summary.total_net_payroll) }}
            </h3>
            <svg
              v-if="sparklinePoints"
              viewBox="0 0 72 28"
              class="w-20 h-7 shrink-0 text-emerald-500"
              aria-hidden="true"
            >
              <polyline
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                :points="sparklinePoints"
              />
            </svg>
          </div>
          <p class="mt-3 text-[11px] font-bold text-slate-400">{{ periodLabel }}</p>
        </article>

        <!-- 2 Base -->
        <article
          class="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5"
        >
          <span
            class="absolute top-3 end-3 w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] font-black text-slate-500 flex items-center justify-center"
          >2</span>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ $t('payroll.basicSalary') }}</p>
          <h3 class="mt-2 text-2xl font-black text-khubrat-blue dark:text-white tabular-nums">
            {{ formatCurrency(store.summary.total_base_salary) }}
          </h3>
          <p
            v-if="momHint"
            class="mt-3 text-[11px] font-bold"
            :class="momHint.positive ? 'text-emerald-500' : 'text-rose-500'"
          >
            {{ momHint.text }}
          </p>
          <p v-else class="mt-3 text-[11px] font-bold text-slate-400">{{ periodLabel }}</p>
        </article>

        <!-- 3 Allowances / Deductions -->
        <article
          class="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5"
        >
          <span
            class="absolute top-3 end-3 w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] font-black text-slate-500 flex items-center justify-center"
          >3</span>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ $t('payroll.allowances') }} / {{ $t('payroll.deductions') }}</p>
          <h3 class="mt-2 text-xl font-black tabular-nums">
            <span class="text-khubrat-blue dark:text-white">{{ formatCurrency(store.summary.total_allowances) }}</span>
            <span class="text-slate-300 dark:text-slate-600 mx-1">/</span>
            <span class="text-rose-500">{{ formatCurrency(store.summary.total_deductions) }}</span>
          </h3>
          <div class="mt-3 flex items-center gap-3 text-lg">
            <i class="fa-solid fa-thumbs-up text-emerald-500"></i>
            <i class="fa-solid fa-thumbs-down text-rose-500"></i>
          </div>
        </article>

        <!-- 4 Savings -->
        <article
          class="relative rounded-2xl border shadow-sm p-5 overflow-hidden"
          :class="savingsPositive
            ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100 dark:from-emerald-950/40 dark:to-slate-800 dark:border-emerald-900/40'
            : 'bg-gradient-to-br from-rose-50 to-white border-rose-100 dark:from-rose-950/40 dark:to-slate-800 dark:border-rose-900/40'"
        >
          <span
            class="absolute top-3 end-3 w-6 h-6 rounded-md bg-white/80 dark:bg-slate-700 text-[10px] font-black text-slate-500 flex items-center justify-center"
          >4</span>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ $t('payroll.totalSavings') }}</p>
          <h3 class="mt-2 text-2xl font-black text-khubrat-blue dark:text-white tabular-nums">
            {{ formatCurrency(store.totalSavings) }}
          </h3>
          <span
            class="inline-flex mt-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide"
            :class="savingsPositive
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'"
          >
            {{ savingsPositive ? $t('payroll.positive') : $t('payroll.negative') }}
          </span>
        </article>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm lg:col-span-2"
        >
          <h4 class="text-md font-bold text-khubrat-blue dark:text-white mb-4">
            {{ $t('payroll.costTrend') }}
          </h4>
          <PayrollCostTrendChart :trend="store.monthlyCostTrend" :year="store.filters.year" />
        </div>

        <div
          class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <h4 class="text-md font-bold text-khubrat-blue dark:text-white mb-4">
            {{ $t('payroll.distribution', { period: periodLabel }) }}
          </h4>
          <PayrollDistributionChart
            :base-salary="store.summary.total_base_salary"
            :allowances="store.summary.total_allowances"
            :deductions="store.summary.total_deductions"
            :net-payroll="store.summary.total_net_payroll"
          />
        </div>
      </div>
    </template>

    <BaseAlert v-else-if="!store.loading" variant="info">
      {{ $t('payroll.noAnalytics') }}
    </BaseAlert>
  </section>
</template>

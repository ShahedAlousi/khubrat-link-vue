<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { useI18n } from 'vue-i18n'
import { useHrAnalyticsStore } from '@/stores/hrAnalytics.store'

const store = useHrAnalyticsStore()
const { t } = useI18n()

const distribution = computed(() => store.performanceDistribution?.distribution ?? {})
const totalEvaluations = computed(() => store.performanceDistribution?.total_evaluations ?? 0)

// تدرج حراري: أخضر زمردي (ممتاز) -> أحمر قرمزي (ضعيف)
const categories = computed(() => [
  { key: 'excellent', label: t('evaluations.excellent'), color: '#10b981' },
  { key: 'good', label: t('evaluations.good'), color: '#84cc16' },
  { key: 'acceptable', label: t('evaluations.acceptable'), color: '#f59e0b' },
  { key: 'weak', label: t('evaluations.weak'), color: '#dc2626' }
])

const chartData = computed(() => ({
  labels: categories.value.map((c) => c.label),
  datasets: [
    {
      label: t('companyDashboard.employees'),
      data: categories.value.map((c) => distribution.value[c.key]?.count ?? 0),
      backgroundColor: categories.value.map((c) => c.color),
      borderRadius: 6,
      barThickness: 36
    }
  ]
}))

const options = computed(() => ({
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const pct = distribution.value[categories.value[ctx.dataIndex]?.key]?.percentage ?? 0
          return `${t('common.employeesCount', { n: ctx.parsed.y })} (${pct}%)`
        }
      }
    }
  },
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } }
  }
}))
</script>

<template>
  <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-64">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-slate-600 dark:text-slate-300">{{ $t('evaluations.performanceDistribution') }}</h3>
      <span class="text-xs text-slate-400">{{ $t('evaluations.evaluationsCount', { n: totalEvaluations }) }}</span>
    </div>
    <div v-if="store.errorPerformance" class="text-xs text-red-500 mt-1">{{ store.errorPerformance }}</div>

    <div class="h-[190px] mt-3">
      <Bar :data="chartData" :options="options" />
    </div>
  </div>
</template>
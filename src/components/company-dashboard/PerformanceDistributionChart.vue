<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { useHrAnalyticsStore } from '@/stores/hrAnalytics.store'

const store = useHrAnalyticsStore()

const distribution = computed(() => store.performanceDistribution?.distribution ?? {})
const totalEvaluations = computed(() => store.performanceDistribution?.total_evaluations ?? 0)

// تدرج حراري: أخضر زمردي (ممتاز) -> أحمر قرمزي (ضعيف)
const categories = [
  { key: 'excellent', label: 'Excellent', color: '#10b981' },
  { key: 'good', label: 'Good', color: '#84cc16' },
  { key: 'acceptable', label: 'Acceptable', color: '#f59e0b' },
  { key: 'weak', label: 'Weak', color: '#dc2626' }
]

const chartData = computed(() => ({
  labels: categories.map((c) => c.label),
  datasets: [
    {
      label: 'Employees',
      data: categories.map((c) => distribution.value[c.key]?.count ?? 0),
      backgroundColor: categories.map((c) => c.color),
      borderRadius: 6,
      barThickness: 36
    }
  ]
}))

const options = {
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const pct = distribution.value[categories[ctx.dataIndex]?.key]?.percentage ?? 0
          return `${ctx.parsed.y} employees (${pct}%)`
        }
      }
    }
  },
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } }
  }
}
</script>

<template>
  <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-64">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-slate-600 dark:text-slate-300">Performance Distribution</h3>
      <span class="text-xs text-slate-400">{{ totalEvaluations }} evaluations</span>
    </div>
    <div v-if="store.errorPerformance" class="text-xs text-red-500 mt-1">{{ store.errorPerformance }}</div>

    <div class="h-[190px] mt-3">
      <Bar :data="chartData" :options="options" />
    </div>
  </div>
</template>
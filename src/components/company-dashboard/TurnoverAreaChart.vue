<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { useI18n } from 'vue-i18n'
import { useHrAnalyticsStore } from '@/stores/hrAnalytics.store'

const props = defineProps({
  benchmark: { type: Number, default: 5 } // percent, configurable prop
})

const store = useHrAnalyticsStore()
const { t } = useI18n()

const quarters = computed(() => store.turnover?.quarters ?? [])
const labels = computed(() => quarters.value.map((q) => q.quarter))
const series = computed(() => quarters.value.map((q) => Number(q.turnover_rate_percentage ?? 0)))
const benchmarkSeries = computed(() => quarters.value.map(() => Number(props.benchmark)))

const data = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: t('companyDashboard.turnoverPct'),
      data: series.value,
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.12)',
      fill: true,
      tension: 0.4,
      pointRadius: 4
    },
    {
      label: t('companyDashboard.benchmark'),
      data: benchmarkSeries.value,
      borderColor: '#ef4444',
      borderDash: [6, 4],
      fill: false,
      tension: 0,
      pointRadius: 0
    }
  ]
}))

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: true, position: 'bottom' } },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { callback: (v) => v + '%' }
    }
  }
}))
</script>

<template>
  <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-64">
    <h3 class="text-sm font-semibold text-slate-600 dark:text-slate-300">{{ $t('companyDashboard.quarterlyTurnover') }}</h3>
    <div class="h-[220px] mt-2">
      <Line :data="data" :options="options" />
    </div>
  </div>
</template>
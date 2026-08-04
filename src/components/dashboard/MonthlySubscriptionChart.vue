<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'

const props = defineProps({
  // Array of { month: string, count: number } from /api/companies/stats
  analytics: { type: Array, default: () => [] }
})

const chartData = computed(() => ({
  labels: props.analytics.map((row) => row.month),
  datasets: [
    {
      label: 'New Subscriptions',
      data: props.analytics.map((row) => row.count),
      borderColor: '#002173',
      backgroundColor: 'rgba(0, 33, 115, 0.12)',
      pointBackgroundColor: '#FCD88A',
      pointBorderColor: '#002173',
      pointRadius: 4,
      tension: 0.35,
      fill: true
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } }
  }
}
</script>

<template>
  <div class="h-80 relative">
    <p v-if="!analytics.length" class="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-400">
      No analytics data yet.
    </p>
    <Line v-else :data="chartData" :options="chartOptions" />
  </div>
</template>

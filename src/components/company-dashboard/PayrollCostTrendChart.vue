<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { formatCurrency } from '@/utils/format'

const props = defineProps({
  /** Array of { month, month_name, total_cost } */
  trend: { type: Array, default: () => [] },
  year: { type: Number, default: () => new Date().getFullYear() }
})

const chartData = computed(() => ({
  labels: props.trend.map((row) => row.month_name || String(row.month)),
  datasets: [
    {
      label: 'Payroll cost',
      data: props.trend.map((row) => Number(row.total_cost) || 0),
      borderColor: '#002173',
      backgroundColor: (ctx) => {
        const chart = ctx.chart
        const { ctx: c, chartArea } = chart
        if (!chartArea) return 'rgba(0, 33, 115, 0.12)'
        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(0, 33, 115, 0.35)')
        gradient.addColorStop(1, 'rgba(0, 33, 115, 0.02)')
        return gradient
      },
      pointBackgroundColor: '#002173',
      pointBorderColor: '#FCD88A',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.4,
      fill: true
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f172a',
      titleFont: { weight: 'bold', size: 12 },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        title(items) {
          const label = items[0]?.label || ''
          return `${label} ${props.year}`
        },
        label(ctx) {
          return `Payroll cost: ${formatCurrency(ctx.raw)}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { size: 11, weight: '600' } }
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(148, 163, 184, 0.2)' },
      ticks: {
        color: '#94a3b8',
        font: { size: 11, weight: '600' },
        callback(value) {
          if (value >= 1000) return `${value / 1000}K`
          return value
        }
      }
    }
  }
}
</script>

<template>
  <div class="h-72 relative">
    <p
      v-if="!trend.length"
      class="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-400"
    >
      No cost trend data yet.
    </p>
    <Line v-else :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { Doughnut } from 'vue-chartjs'
import { computed } from 'vue'
import { useHrAnalyticsStore } from '@/stores/hrAnalytics.store'
import ChartJS from '@/utils/chart-setup' // use project's chart init

const store = useHrAnalyticsStore()

const latest = computed(() => {
  const d = store.dailyVerification ?? { timeline: [] }
  if (!Array.isArray(d.timeline) || d.timeline.length === 0) return null
  return d.timeline[d.timeline.length - 1]
})

const compliance = computed(() => Number(latest.value?.digital_compliance_rate ?? 0))
const manual = computed(() => Number(latest.value?.manual_rate ?? 0))

// simple plugin to draw center text
const centerTextPlugin = {
  id: 'centerText',
  beforeDraw(chart) {
    const { ctx, width, height } = chart
    ctx.save()
    const text = `${Math.round(compliance.value)}%`
    ctx.font = '600 18px Inter, system-ui, -apple-system'
    ctx.fillStyle = '#0ea5a4' // teal-ish
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, width / 2, height / 2 - 6)

    ctx.font = '400 11px Inter, system-ui, -apple-system'
    ctx.fillStyle = '#6b7280'
    ctx.fillText('Digital compliance', width / 2, height / 2 + 14)
    ctx.restore()
  }
}

ChartJS.register && ChartJS.register(centerTextPlugin)

const chartData = computed(() => {
  const c = Math.max(0, Math.min(100, compliance.value))
  return {
    labels: ['Compliant', 'Not compliant'],
    datasets: [
      {
        data: [c, 100 - c],
        backgroundColor: ['#06b6d4', '#e6eaf2'],
        hoverOffset: 6
      }
    ]
  }
})

const options = {
  cutout: '70%',
  plugins: { legend: { display: false } },
  maintainAspectRatio: false
}
</script>

<template>
  <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-64">
    <h3 class="text-sm font-semibold text-slate-600 dark:text-slate-300">Daily Verification Rate</h3>
    <div class="h-[200px] mt-3">
      <Doughnut :data="chartData" :options="options" />
    </div>

    <div class="mt-3 text-xs text-slate-500 dark:text-slate-400">
      <div>Manual rate: <span class="font-medium">{{ manual }}%</span></div>
      <div class="text-2xs text-slate-400 mt-1">(digital vs manual verification split for latest day)</div>
    </div>
  </div>
</template>
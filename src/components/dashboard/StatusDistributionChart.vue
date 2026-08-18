<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Doughnut } from 'vue-chartjs'

const props = defineProps({
  // { active: number, frozen: number, at_risk: number } from /api/companies/stats
  distribution: {
    type: Object,
    default: () => ({ active: 0, frozen: 0, at_risk: 0 })
  }
})

const { t } = useI18n()

const chartData = computed(() => ({
  labels: [t('status.active'), t('status.frozen'), t('status.at_risk')],
  datasets: [
    {
      data: [props.distribution.active ?? 0, props.distribution.frozen ?? 0, props.distribution.at_risk ?? 0],
      backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
      borderWidth: 0
    }
  ]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: { display: false }
  }
}))
</script>

<template>
  <div class="h-64 relative flex items-center justify-center">
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
</template>

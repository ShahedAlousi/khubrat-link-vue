<script setup>
import { computed } from 'vue'
import { Doughnut, Bar } from 'vue-chartjs'
import { useHrAnalyticsStore } from '@/stores/hrAnalytics.store'

const store = useHrAnalyticsStore()

const gender = computed(() => store.demographics?.gender_distribution ?? {})
const age = computed(() => store.demographics?.age_distribution ?? {})

const genderData = computed(() => ({
  labels: ['Male', 'Female', 'Unspecified'],
  datasets: [
    {
      data: [gender.value.male ?? 0, gender.value.female ?? 0, gender.value.unspecified ?? 0],
      backgroundColor: ['#2563eb', '#ec4899', '#94a3b8'],
      hoverOffset: 6
    }
  ]
}))

const genderOptions = {
  cutout: '65%',
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } }
  }
}

const ageLabels = ['Under 25', '25-34', '35-44', '45-54', '55+']

const ageData = computed(() => ({
  labels: ageLabels,
  datasets: [
    {
      label: 'Employees',
      data: [
        age.value.under_25 ?? 0,
        age.value['25_34'] ?? 0,
        age.value['35_44'] ?? 0,
        age.value['45_54'] ?? 0,
        age.value['55_plus'] ?? 0
      ],
      backgroundColor: '#0ea5a4',
      borderRadius: 4,
      barThickness: 16
    }
  ]
}))

const ageOptions = {
  indexAxis: 'y',
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { beginAtZero: true, ticks: { precision: 0 } }
  }
}
</script>

<template>
  <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-72">
    <h3 class="text-sm font-semibold text-slate-600 dark:text-slate-300">Workforce Demographics</h3>
    <div v-if="store.errorDemographics" class="text-xs text-red-500 mt-1">{{ store.errorDemographics }}</div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 h-[190px]">
      <div class="h-full">
        <Doughnut :data="genderData" :options="genderOptions" />
      </div>
      <div class="h-full">
        <Bar :data="ageData" :options="ageOptions" />
      </div>
    </div>
  </div>
</template>
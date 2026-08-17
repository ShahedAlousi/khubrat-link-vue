<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { useHrAnalyticsStore } from '@/stores/hrAnalytics.store'

const store = useHrAnalyticsStore()

// نرتب تنازلياً بالفرونت (بغض النظر عن ترتيب الباك اند) عشان نضمن الأعلى استهلاكاً أولاً
const sortedDepartments = computed(() => {
  const list = store.departmentBudgets ?? []
  return [...list].sort((a, b) => (b.total_budget_spent ?? 0) - (a.total_budget_spent ?? 0))
})

const chartData = computed(() => {
  const departments = sortedDepartments.value
  return {
    labels: departments.map((d) => d.department_name),
    datasets: [
      {
        label: 'Budget spent',
        data: departments.map((d) => Number(d.total_budget_spent ?? 0)),
        backgroundColor: departments.map((_, i) => (i === 0 ? '#f59e0b' : '#94a3b8')),
        borderRadius: 4,
        barThickness: 18
      }
    ]
  }
})

const options = {
  indexAxis: 'y',
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { beginAtZero: true, ticks: { callback: (v) => v.toLocaleString() } }
  }
}
</script>

<template>
  <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-72">
    <h3 class="text-sm font-semibold text-slate-600 dark:text-slate-300">Department Budget Consumption</h3>
    <div v-if="store.errorDepartmentBudgets" class="text-xs text-red-500 mt-1">{{ store.errorDepartmentBudgets }}</div>

    <div class="h-[210px] mt-3">
      <Bar :data="chartData" :options="options" />
    </div>
  </div>
</template>
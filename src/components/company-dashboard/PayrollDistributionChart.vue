<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Doughnut } from 'vue-chartjs'
import { formatCurrency } from '@/utils/format'

const { t } = useI18n()

const props = defineProps({
  baseSalary: { type: Number, default: 0 },
  allowances: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netPayroll: { type: Number, default: 0 }
})

const segments = computed(() => [
  {
    key: 'base',
    label: t('payroll.basicSalary'),
    value: Number(props.baseSalary) || 0,
    color: '#002173',
    icon: 'fa-dollar-sign',
    iconClass: 'bg-khubrat-blue/10 text-khubrat-blue'
  },
  {
    key: 'allowances',
    label: t('payroll.allowances'),
    value: Number(props.allowances) || 0,
    color: '#10b981',
    icon: 'fa-plus',
    iconClass: 'bg-emerald-500/10 text-emerald-600'
  },
  {
    key: 'deductions',
    label: t('payroll.deductions'),
    value: Number(props.deductions) || 0,
    color: '#f43f5e',
    icon: 'fa-minus',
    iconClass: 'bg-rose-500/10 text-rose-600'
  }
])

const chartData = computed(() => ({
  labels: segments.value.map((s) => s.label),
  datasets: [
    {
      data: segments.value.map((s) => s.value),
      backgroundColor: segments.value.map((s) => s.color),
      borderWidth: 0,
      hoverOffset: 4
    }
  ]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label(ctx) {
          return `${ctx.label}: ${formatCurrency(ctx.raw)}`
        }
      }
    }
  }
}))
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="h-52 relative flex items-center justify-center">
      <Doughnut :data="chartData" :options="chartOptions" />
      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6 text-center">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">{{ $t('payroll.netPayroll') }}</p>
        <p class="text-sm font-black text-khubrat-blue dark:text-white leading-tight">
          {{ formatCurrency(netPayroll) }}
        </p>
      </div>
    </div>

    <ul class="space-y-2.5 border-t border-slate-100 dark:border-slate-700 pt-4">
      <li
        v-for="item in segments"
        :key="item.key"
        class="flex items-center justify-between gap-3 text-sm"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: item.color }" />
          <span class="font-semibold text-slate-600 dark:text-slate-300 truncate">{{ item.label }}</span>
          <span
            class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0"
            :class="item.iconClass"
          >
            <i class="fa-solid" :class="item.icon"></i>
          </span>
        </div>
        <span class="font-bold text-khubrat-blue dark:text-white tabular-nums shrink-0">
          {{ formatCurrency(item.value) }}
        </span>
      </li>
    </ul>
  </div>
</template>

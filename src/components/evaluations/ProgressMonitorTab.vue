<script setup>
import { computed, onMounted, watch } from 'vue'
import { useEvaluationsStore } from '@/stores/useEvaluationsStore'
import BaseAlert from '@/components/common/BaseAlert.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const props = defineProps({
  cycleId: { type: [String, Number], default: null }
})

const evaluationsStore = useEvaluationsStore()

// جلب تقدم الموظفين عند توفر معرف الدورة أو تغييره
async function loadProgress() {
  if (!props.cycleId) return
  await evaluationsStore.fetchProgress(props.cycleId)
}
//onMounted(loadProgress)
//watch(() => props.cycleId, loadProgress)
watch(
  () => props.cycleId,
  (newCycleId) => {
    if (newCycleId) {
      evaluationsStore.fetchProgress(newCycleId)
    }
  },
  { immediate: true }
)

// قراءة اسم الموظف من داخل كائن employee
function employeeName(row) { 
  return row.employee?.full_name || row.employee_name || row.name || '—' 
}

// قراءة اسم القسم من الحقل المباشر أو من داخل كائن employee
function employeeDept(row) { 
  return row.department_name || row.employee?.department?.name || row.department || '' 
}

// قراءة التقييمات المنجزة
function sheetsCompleted(row) { 
  return row.completed_reviews ?? row.completed_sheets ?? 0 
}

// قراءة التقييمات المسندة الإجمالية
function sheetsTotal(row) { 
  return row.assigned_reviews ?? row.total_sheets ?? 0 
}

// حساب النسبة أو أخذها جاهزة
function percent(row) {
  if (row.completion_percentage !== undefined && row.completion_percentage !== null) {
    return row.completion_percentage
  }
  const total = sheetsTotal(row)
  if (!total) return 0
  return Math.round((sheetsCompleted(row) / total) * 100)
}
function isCompleted(row) {
  return (row.status || '').toLowerCase() === 'completed' || (sheetsTotal(row) > 0 && sheetsCompleted(row) >= sheetsTotal(row))
}
function initials(name) {
  return (name || '').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

const overallCompletionRate = computed(() => {
  const rows = evaluationsStore.progressData
  if (!rows.length) return 0
  return Math.round(rows.reduce((acc, r) => acc + percent(r), 0) / rows.length)
})
const completedCount = computed(() => evaluationsStore.progressData.filter(isCompleted).length)
const pendingCount = computed(() => evaluationsStore.progressData.length - completedCount.value)

async function remind(row) {
  await evaluationsStore.sendReminderToEmployee(props.cycleId, row.employee_id || row.id)
}
</script>

<template>
  <div class="space-y-6">
    <BaseAlert v-if="evaluationsStore.error" variant="error">{{ evaluationsStore.error }}</BaseAlert>
    <LoadingSpinner v-if="evaluationsStore.loading" full-height />

    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-khubrat-blue/10 dark:bg-khubrat-goldLight/10 text-khubrat-blue dark:text-khubrat-goldLight rounded-xl">
            <i class="fa-solid fa-percent text-xl"></i>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 font-bold block uppercase">Overall Completion Rate</span>
            <h3 class="text-xl font-black text-khubrat-blue dark:text-white mt-0.5">{{ overallCompletionRate }}%</h3>
          </div>
        </div>
        <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <i class="fa-solid fa-circle-check text-xl"></i>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 font-bold block uppercase">Completed</span>
            <h3 class="text-xl font-black text-emerald-500 mt-0.5">{{ completedCount }} Employees</h3>
          </div>
        </div>
        <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <i class="fa-solid fa-hourglass-half text-xl"></i>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 font-bold block uppercase">Pending</span>
            <h3 class="text-xl font-black text-amber-500 mt-0.5">{{ pendingCount }} Employees</h3>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div class="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-wrap gap-4">
          <h5 class="font-bold text-khubrat-blue dark:text-white text-sm">Submission Progress Directory</h5>
          <span class="text-xs text-slate-400">Total Assigned: {{ evaluationsStore.progressData.length }} Staff members</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-slate-100/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-300 text-xs">
              <tr>
                <th class="p-4">Employee Details</th>
                <th class="p-4">Submission Metrics</th>
                <th class="p-4">Percentage</th>
                <th class="p-4">Status Flag</th>
                <th class="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
              <tr v-for="row in evaluationsStore.progressData" :key="row.employee_id || row.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all">
                <td class="p-4 flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-khubrat-blue/10 dark:bg-khubrat-goldLight/10 text-khubrat-blue dark:text-khubrat-goldLight flex items-center justify-center font-bold text-[10px]">
                    {{ initials(employeeName(row)) }}
                  </div>
                  <div>
                    <h5 class="font-bold text-slate-800 dark:text-white text-xs">{{ employeeName(row) }}</h5>
                    <p class="text-[10px] text-slate-400">{{ employeeDept(row) }}</p>
                  </div>
                </td>
                <td class="p-4">
                  <div class="flex items-center gap-2 max-w-[150px]">
                    <div class="flex-1 bg-slate-150 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div class="bg-khubrat-blue dark:bg-khubrat-goldLight h-full rounded-full" :style="{ width: percent(row) + '%' }"></div>
                    </div>
                    <span class="font-bold text-[10px] text-slate-500">{{ sheetsCompleted(row) }}/{{ sheetsTotal(row) }}</span>
                  </div>
                </td>
                <td class="p-4 font-bold text-khubrat-blue dark:text-khubrat-goldLight">{{ percent(row) }}%</td>
                <td class="p-4">
                  <span v-if="isCompleted(row)" class="px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg font-bold border border-emerald-500/20">Completed</span>
                  <span v-else class="px-2 py-1 bg-amber-500/10 text-amber-500 rounded-lg font-bold border border-amber-500/20">Pending</span>
                </td>
                <td class="p-4 text-center">
                  <button
                    v-if="!isCompleted(row)"
                    class="w-8 h-8 rounded-lg bg-slate-50 hover:bg-khubrat-blue hover:text-white dark:bg-slate-900 flex items-center justify-center transition-all mx-auto border border-slate-200 dark:border-slate-700"
                    @click="remind(row)"
                  >
                    <i class="fa-regular fa-bell"></i>
                  </button>
                  <span v-else class="text-slate-400">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
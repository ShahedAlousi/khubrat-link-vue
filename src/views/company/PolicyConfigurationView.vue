<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AttendancePolicyPanel from '@/components/policies/AttendancePolicyPanel.vue'
import LeaveTypesPanel from '@/components/policies/LeaveTypesPanel.vue'
import PayrollSettingsPanel from '@/components/policies/PayrollSettingsPanel.vue'
import AppraisalsPanel from '@/components/policies/AppraisalsPanel.vue'
import HolidaysPanel from '@/components/policies/HolidaysPanel.vue'

const router = useRouter()
const authStore = useAuthStore()

const tabs = [
  { id: 'attendance', label: 'Attendance', icon: 'fa-business-time' },
  { id: 'leaves', label: 'Leave Policies', icon: 'fa-mug-hot' },
  { id: 'payroll', label: 'Payroll Settings', icon: 'fa-receipt' },
  { id: 'appraisals', label: 'Performance Appraisals', icon: 'fa-star-half-stroke' },
  { id: 'holidays', label: 'Holidays & Calendar', icon: 'fa-calendar-days' }
]

const activeTab = ref('attendance')

onMounted(() => {
  if (!authStore.canManagePolicies) {
    router.replace({ name: 'company-dashboard' })
  }
})
</script>

<template>
  <div v-if="authStore.canManagePolicies" class="space-y-6 max-w-7xl mx-auto">
    <!-- Explanatory banner -->
    <div class="bg-gradient-to-r from-khubrat-blue to-blue-900 text-white p-6 rounded-2xl shadow-md border-b-4 border-khubrat-goldLight">
      <div class="space-y-1 max-w-3xl">
        <h3 class="text-lg font-bold text-khubrat-goldLight">Tenant Operational Parameters</h3>
        <p class="text-xs text-slate-200 leading-relaxed">
          Establish core administrative policies for your enterprise. Modify attendance regulations, vacation
          allocations, compensation criteria, performance appraisal scales, and national holiday configurations —
          each section below saves independently to its own API endpoint.
        </p>
      </div>
    </div>

    <!-- Sub-tabs -->
    <div class="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="policy-tab-btn px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
        :class="
          activeTab === tab.id
            ? 'bg-khubrat-blue text-khubrat-goldLight dark:bg-khubrat-goldLight dark:text-khubrat-blue shadow-sm'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
        "
        @click="activeTab = tab.id"
      >
        <i class="fa-solid" :class="tab.icon"></i> {{ tab.label }}
      </button>
    </div>

    <!-- Panels: kept mounted (v-show) rather than v-if, so the Leaflet map
         inside AttendancePolicyPanel doesn't get destroyed/recreated (and
         re-fetched data isn't lost) every time the tenant admin switches tabs. -->
    <div>
      <AttendancePolicyPanel v-show="activeTab === 'attendance'" />
      <LeaveTypesPanel v-show="activeTab === 'leaves'" />
      <PayrollSettingsPanel v-show="activeTab === 'payroll'" />
      <AppraisalsPanel v-show="activeTab === 'appraisals'" />
      <HolidaysPanel v-show="activeTab === 'holidays'" />
    </div>
  </div>
</template>

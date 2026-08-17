<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AttendancePolicyPanel from '@/components/policies/AttendancePolicyPanel.vue'
import LeaveTypesPanel from '@/components/policies/LeaveTypesPanel.vue'
import PayrollSettingsPanel from '@/components/policies/PayrollSettingsPanel.vue'
import AppraisalsPanel from '@/components/policies/AppraisalsPanel.vue'
import HolidaysPanel from '@/components/policies/HolidaysPanel.vue'

const router = useRouter()
const authStore = useAuthStore()

const readonly = computed(() => !authStore.canManagePolicies)

const tabs = [
  { id: 'attendance', label: 'Attendance', icon: 'fa-business-time' },
  { id: 'leaves', label: 'Leave Policies', icon: 'fa-mug-hot' },
  { id: 'payroll', label: 'Payroll Settings', icon: 'fa-receipt' },
  { id: 'appraisals', label: 'Performance Appraisals', icon: 'fa-star-half-stroke' },
  { id: 'holidays', label: 'Holidays & Calendar', icon: 'fa-calendar-days' }
]

const activeTab = ref('attendance')

onMounted(() => {
  if (!authStore.canViewPolicies) {
    router.replace({ name: 'company-dashboard' })
  }
})
</script>

<template>
  <div v-if="authStore.canViewPolicies" class="space-y-6 max-w-7xl mx-auto">
    <div class="bg-gradient-to-r from-khubrat-blue to-blue-900 text-white p-6 rounded-2xl shadow-md border-b-4 border-khubrat-goldLight">
      <div class="space-y-1 max-w-3xl">
        <h3 class="text-lg font-bold text-khubrat-goldLight">
          {{ readonly ? 'Company Policy Overview' : 'Tenant Operational Parameters' }}
        </h3>
        <p class="text-xs text-slate-200 leading-relaxed">
          <template v-if="readonly">
            Review the company&apos;s configured attendance, leave, payroll, appraisal, and holiday policies.
            This view is read-only — contact the general manager to request changes.
          </template>
          <template v-else>
            Establish core administrative policies for your enterprise. Modify attendance regulations, vacation
            allocations, compensation criteria, performance appraisal scales, and national holiday configurations —
            each section below saves independently to its own API endpoint.
          </template>
        </p>
      </div>
    </div>

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

    <div>
      <AttendancePolicyPanel v-show="activeTab === 'attendance'" :readonly="readonly" />
      <LeaveTypesPanel v-show="activeTab === 'leaves'" :readonly="readonly" />
      <PayrollSettingsPanel v-show="activeTab === 'payroll'" :readonly="readonly" />
      <AppraisalsPanel v-show="activeTab === 'appraisals'" :readonly="readonly" />
      <HolidaysPanel v-show="activeTab === 'holidays'" :readonly="readonly" />
    </div>
  </div>
</template>

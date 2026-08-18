<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import AttendancePolicyPanel from '@/components/policies/AttendancePolicyPanel.vue'
import LeaveTypesPanel from '@/components/policies/LeaveTypesPanel.vue'
import PayrollSettingsPanel from '@/components/policies/PayrollSettingsPanel.vue'
import AppraisalsPanel from '@/components/policies/AppraisalsPanel.vue'
import HolidaysPanel from '@/components/policies/HolidaysPanel.vue'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const readonly = computed(() => !authStore.canManagePolicies)

const tabs = computed(() => [
  { id: 'attendance', label: t('policies.tabAttendance'), icon: 'fa-business-time' },
  { id: 'leaves', label: t('policies.tabLeave'), icon: 'fa-mug-hot' },
  { id: 'payroll', label: t('policies.tabPayroll'), icon: 'fa-receipt' },
  { id: 'appraisals', label: t('policies.tabAppraisals'), icon: 'fa-star-half-stroke' },
  { id: 'holidays', label: t('policies.tabHolidays'), icon: 'fa-calendar-days' }
])

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
          {{ readonly ? $t('policies.overviewTitle') : $t('policies.editTitle') }}
        </h3>
        <p class="text-xs text-slate-200 leading-relaxed">
          {{ readonly ? $t('policies.readonlyHint') : $t('policies.editHint') }}
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

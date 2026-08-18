<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PolicyReadonlyValue from './PolicyReadonlyValue.vue'
import CompanyGeofenceMap from './CompanyGeofenceMap.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useAttendancePolicyStore } from '@/stores/attendancePolicy.store'

const props = defineProps({
  readonly: { type: Boolean, default: false }
})

const { t } = useI18n()
const authStore = useAuthStore()
const attendancePolicyStore = useAttendancePolicyStore()

const form = reactive({
  work_start_time: '',
  work_end_time: '',
  allowed_late_minutes: '',
  allowed_early_leave_minutes: '',
  allows_overtime: false,
  allowed_perimeter: '',
  latitude: null,
  longitude: null
})

const alertMessage = ref('')
const alertVariant = ref('success')

function displayTime(value) {
  return value ? String(value).slice(0, 5) : t('common.emDash')
}

function displayValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') return t('common.emDash')
  return `${value}${suffix}`
}

/** The API returns "HH:MM:SS" while <input type="time"> expects "HH:MM". */
function toTimeInput(value) {
  return value ? String(value).slice(0, 5) : ''
}

function syncFormFromStore() {
  const policy = attendancePolicyStore.policy
  form.work_start_time = toTimeInput(policy.work_start_time)
  form.work_end_time = toTimeInput(policy.work_end_time)
  form.allowed_late_minutes = policy.allowed_late_minutes
  form.allowed_early_leave_minutes = policy.allowed_early_leave_minutes
  form.allows_overtime = policy.allows_overtime
  form.allowed_perimeter = policy.allowed_perimeter
  form.latitude = policy.latitude
  form.longitude = policy.longitude
}

onMounted(async () => {
  if (!authStore.companyId) return
  try {
    await attendancePolicyStore.fetchPolicy(authStore.companyId)
  } catch {
    // Leave the fields empty when no policy exists yet or the request fails.
  }
  syncFormFromStore()
})

// دالة إرسال ريكويست سياسة الحضور فقط
async function handleSavePolicy() {
  alertMessage.value = ''
  try {
    await attendancePolicyStore.saveAttendancePolicy(authStore.companyId, {
      work_start_time: form.work_start_time ? `${form.work_start_time}:00` : '',
      work_end_time: form.work_end_time ? `${form.work_end_time}:00` : '',
      allowed_late_minutes: form.allowed_late_minutes,
      allowed_early_leave_minutes: form.allowed_early_leave_minutes,
      allows_overtime: form.allows_overtime
    })
    alertVariant.value = 'success'
    alertMessage.value = t('policies.attendanceSaved')
  } catch (err) {
    alertVariant.value = 'error'
    alertMessage.value = attendancePolicyStore.error || t('policies.saveError')
  }
}

// دالة إرسال ريكويست سياسة الموقع الجغرافي فقط
async function handleSaveLocation() {
  alertMessage.value = ''
  try {
    await attendancePolicyStore.saveLocationPolicy(authStore.companyId, {
      allowed_perimeter: form.allowed_perimeter,
      latitude: form.latitude,
      longitude: form.longitude
    })
    alertVariant.value = 'success'
    alertMessage.value = t('policies.geoSaved')
  } catch (err) {
    alertVariant.value = 'error'
    alertMessage.value = attendancePolicyStore.error || t('policies.saveError')
  }
}
</script>

<template>
  <div class="space-y-6">
    <BaseAlert v-if="alertMessage" :variant="alertVariant">{{ alertMessage }}</BaseAlert>

    <div
      v-if="attendancePolicyStore.loading"
      class="flex items-center gap-2 text-xs font-bold text-slate-400"
    >
      <i class="fa-solid fa-circle-notch fa-spin"></i>
      {{ $t('policies.loadingAttendance') }}
    </div>

    <!-- Daily Shift Hours Section -->
    <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      <div class="space-y-1">
        <h4 class="text-md font-bold text-khubrat-blue dark:text-khubrat-goldLight">{{ $t('policies.shiftHours') }}</h4>
        <p class="text-xs text-slate-400">
          {{ $t('policies.shiftHoursHint') }}
        </p>
      </div>

      <div v-if="readonly" class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <PolicyReadonlyValue :label="$t('policies.shiftStart')" :value="displayTime(form.work_start_time)" />
        <PolicyReadonlyValue :label="$t('policies.shiftEnd')" :value="displayTime(form.work_end_time)" />
        <PolicyReadonlyValue :label="$t('policies.lateThreshold')" :value="displayValue(form.allowed_late_minutes, ` ${$t('policies.mins')}`)" />
        <PolicyReadonlyValue :label="$t('policies.earlyThreshold')" :value="displayValue(form.allowed_early_leave_minutes, ` ${$t('policies.mins')}`)" />
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-500 dark:text-slate-300">{{ $t('policies.shiftStart') }}</label>
          <input
            v-model="form.work_start_time"
            type="time"
            class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
          />
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-500 dark:text-slate-300">{{ $t('policies.shiftEnd') }}</label>
          <input
            v-model="form.work_end_time"
            type="time"
            class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
          />
        </div>
      </div>

      <div v-if="!readonly" class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-500 dark:text-slate-300">{{ $t('policies.lateThreshold') }}</label>
          <div class="flex items-center">
            <input
              v-model.number="form.allowed_late_minutes"
              type="number"
              min="0"
              placeholder="15"
              class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-l-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
            />
            <span class="bg-slate-100 dark:bg-slate-700 border-t border-b border-r border-slate-200 dark:border-slate-700 px-4 py-3 rounded-r-xl text-xs font-bold text-slate-400">{{ $t('policies.mins') }}</span>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-500 dark:text-slate-300">{{ $t('policies.earlyThreshold') }}</label>
          <div class="flex items-center">
            <input
              v-model.number="form.allowed_early_leave_minutes"
              type="number"
              min="0"
              placeholder="15"
              class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-l-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
            />
            <span class="bg-slate-100 dark:bg-slate-700 border-t border-b border-r border-slate-200 dark:border-slate-700 px-4 py-3 rounded-r-xl text-xs font-bold text-slate-400">{{ $t('policies.mins') }}</span>
          </div>
        </div>
      </div>

      <div class="pt-2 border-t border-slate-100 dark:border-slate-700">
        <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800">
          <span class="text-xs font-bold text-slate-700 dark:text-slate-300">{{ $t('policies.allowOvertime') }} </span>
          <span v-if="readonly" class="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {{ form.allows_overtime ? $t('common.yes') : $t('common.no') }}
          </span>
          <ToggleSwitch v-else v-model="form.allows_overtime" />
        </div>
      </div>

      <div v-if="!readonly" class="flex justify-end pt-4">
        <BaseButton variant="gold" :loading="attendancePolicyStore.savingPolicy" @click="handleSavePolicy">
          <i class="fa-solid fa-clock"></i>
          {{ $t('policies.keepingPolicies') }}
        </BaseButton>
      </div>
    </div>

    <!-- Geofencing Section -->
    <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      <div class="space-y-1">
        <h4 class="text-md font-bold text-khubrat-blue dark:text-khubrat-goldLight">
          {{ $t('policies.geofenceTitle') }} 
        </h4>
        <p class="text-xs text-slate-400">
          {{ $t('policies.geofenceHint') }}
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        <div class="space-y-4 flex flex-col justify-between h-full">
          <div v-if="readonly" class="space-y-4">
            <PolicyReadonlyValue :label="$t('policies.perimeter')" :value="displayValue(form.allowed_perimeter, ` ${$t('policies.meters')}`)" />
            <div class="grid grid-cols-2 gap-3">
              <PolicyReadonlyValue :label="$t('policies.latitude')" :value="form.latitude ?? $t('common.emDash')" />
              <PolicyReadonlyValue :label="$t('policies.longitude')" :value="form.longitude ?? $t('common.emDash')" />
            </div>
          </div>
          <div v-else class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                {{ $t('policies.perimeter') }} 
              </label>
              <div class="relative rounded-xl shadow-sm">
                <input
                  v-model.number="form.allowed_perimeter"
                  type="number"
                  min="10"
                  max="3000"
                  placeholder="150"
                  class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 p-3.5 pl-16 focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight transition-all font-semibold"
                />
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[10px] font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3.5 rounded-l-xl border-r border-slate-200 dark:border-slate-700">
                  {{ $t('policies.meters') }}
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{{ $t('policies.latitude') }} </label>
                <input
                  :value="form.latitude ?? ''"
                  :placeholder="$t('policies.pickOnMap')"
                  readonly
                  class="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-500 dark:text-slate-400 p-2.5 font-mono cursor-not-allowed"
                />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{{ $t('policies.longitude') }} </label>
                <input
                  :value="form.longitude ?? ''"
                  :placeholder="$t('policies.pickOnMap')"
                  readonly
                  class="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-500 dark:text-slate-400 p-2.5 font-mono cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 relative">
          <CompanyGeofenceMap
            v-model:latitude="form.latitude"
            v-model:longitude="form.longitude"
            :radius="form.allowed_perimeter"
            :readonly="readonly"
          />
        </div>
      </div>

      <div v-if="!readonly" class="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
        <BaseButton variant="gold" :loading="attendancePolicyStore.savingLocation" @click="handleSaveLocation">
          <i class="fa-solid fa-map-location-dot"></i>
          {{ $t('policies.saveLocation') }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
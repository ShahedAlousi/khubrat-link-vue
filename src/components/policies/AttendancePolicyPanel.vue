<script setup>
import { reactive, ref } from 'vue'
import CompanyGeofenceMap from './CompanyGeofenceMap.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useAttendancePolicyStore } from '@/stores/attendancePolicy.store'

const authStore = useAuthStore()
const attendancePolicyStore = useAttendancePolicyStore()

const form = reactive({
  work_start_time: attendancePolicyStore.policy.work_start_time.slice(0, 5),
  work_end_time: attendancePolicyStore.policy.work_end_time.slice(0, 5),
  allowed_late_minutes: attendancePolicyStore.policy.allowed_late_minutes,
  allowed_early_leave_minutes: attendancePolicyStore.policy.allowed_early_leave_minutes,
  allows_overtime: attendancePolicyStore.policy.allows_overtime,
  allowed_perimeter: attendancePolicyStore.policy.allowed_perimeter,
  latitude: attendancePolicyStore.policy.latitude,
  longitude: attendancePolicyStore.policy.longitude
})

const alertMessage = ref('')
const alertVariant = ref('success')

// دالة إرسال ريكويست سياسة الحضور فقط
async function handleSavePolicy() {
  alertMessage.value = ''
  try {
    await attendancePolicyStore.saveAttendancePolicy(authStore.companyId, {
      work_start_time: `${form.work_start_time}:00`,
      work_end_time: `${form.work_end_time}:00`,
      allowed_late_minutes: form.allowed_late_minutes,
      allowed_early_leave_minutes: form.allowed_early_leave_minutes,
      allows_overtime: form.allows_overtime
    })
    alertVariant.value = 'success'
    alertMessage.value = 'Attendance policies were successfully saved.'
  } catch (err) {
    alertVariant.value = 'error'
    alertMessage.value = attendancePolicyStore.error || 'An error occurred during saving.'
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
    alertMessage.value = 'The geo-finding settings have been successfully saved.'
  } catch (err) {
    alertVariant.value = 'error'
    alertMessage.value = attendancePolicyStore.error || 'An error occurred during saving.'
  }
}
</script>

<template>
  <div class="space-y-6">
    <BaseAlert v-if="alertMessage" :variant="alertVariant">{{ alertMessage }}</BaseAlert>

    <!-- Daily Shift Hours Section -->
    <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      <div class="space-y-1">
        <h4 class="text-md font-bold text-khubrat-blue dark:text-khubrat-goldLight">Daily Shift Hours &amp; Grace Periods</h4>
        <p class="text-xs text-slate-400">
          Specify operational start/end bounds and thresholds to trigger automated salary deductions.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-500 dark:text-slate-300">Default Shift Start Time</label>
          <input
            v-model="form.work_start_time"
            type="time"
            class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
          />
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-500 dark:text-slate-300">Default Shift End Time</label>
          <input
            v-model="form.work_end_time"
            type="time"
            class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-500 dark:text-slate-300">Late Arrival Threshold (Minutes)</label>
          <div class="flex items-center">
            <input
              v-model.number="form.allowed_late_minutes"
              type="number"
              min="1"
              class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-l-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
            />
            <span class="bg-slate-100 dark:bg-slate-700 border-t border-b border-r border-slate-200 dark:border-slate-700 px-4 py-3 rounded-r-xl text-xs font-bold text-slate-400">Mins</span>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-500 dark:text-slate-300">Early Departure Threshold (Minutes)</label>
          <div class="flex items-center">
            <input
              v-model.number="form.allowed_early_leave_minutes"
              type="number"
              min="1"
              class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-l-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
            />
            <span class="bg-slate-100 dark:bg-slate-700 border-t border-b border-r border-slate-200 dark:border-slate-700 px-4 py-3 rounded-r-xl text-xs font-bold text-slate-400">Mins</span>
          </div>
        </div>
      </div>

      <div class="pt-2 border-t border-slate-100 dark:border-slate-700">
        <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800">
          <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Allow Overtime Logging </span>
          <ToggleSwitch v-model="form.allows_overtime" />
        </div>
      </div>

      <!-- الزر الأول: خاص بحفظ سياسات الحضور فقط -->
      <div class="flex justify-end pt-4">
        <BaseButton variant="gold" :loading="attendancePolicyStore.savingPolicy" @click="handleSavePolicy">
          <i class="fa-solid fa-clock"></i>
          Keeping attendance policies
        </BaseButton>
      </div>
    </div>

    <!-- Geofencing Section -->
    <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      <div class="space-y-1">
        <h4 class="text-md font-bold text-khubrat-blue dark:text-khubrat-goldLight">
          Company Geofencing Configuration 
        </h4>
        <p class="text-xs text-slate-400">
          Set up the physical coordinates of the headquarters and the allowed physical perimeter within which
          employees can log attendance.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        <div class="space-y-4 flex flex-col justify-between h-full">
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Allowed Presence Perimeter (Meters) 
              </label>
              <div class="relative rounded-xl shadow-sm">
                <input
                  v-model.number="form.allowed_perimeter"
                  type="number"
                  min="10"
                  max="3000"
                  class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 p-3.5 pl-16 focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight transition-all font-semibold"
                />
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[10px] font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3.5 rounded-l-xl border-r border-slate-200 dark:border-slate-700">
                  Meters
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Latitude </label>
                <input
                  :value="form.latitude"
                  readonly
                  class="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-500 dark:text-slate-400 p-2.5 font-mono cursor-not-allowed"
                />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Longitude </label>
                <input
                  :value="form.longitude"
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
          />
        </div>
      </div>

      <!-- الزر الثاني: خاص بحفظ البصمة الجغرافية فقط -->
      <div class="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
        <BaseButton variant="gold" :loading="attendancePolicyStore.savingLocation" @click="handleSaveLocation">
          <i class="fa-solid fa-map-location-dot"></i>
          Save location settings
        </BaseButton>
      </div>
    </div>
  </div>
</template>
<!--
  AttendanceLogTable.vue
  ============================================================================-->
  <script setup>
  import { ref, computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useAttendanceStore } from '@/stores/attendance.store'
  import { buildIsoDateTime, buildLaravelDateTime, parseTimeForClock } from '@/services/attendanceService'
  import BaseSelect from '@/components/common/BaseSelect.vue'
  import BaseInput from '@/components/common/BaseInput.vue'
  import BaseButton from '@/components/common/BaseButton.vue'
  import BaseAlert from '@/components/common/BaseAlert.vue'
  import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
  import ClockTimePickerModal from './ClockTimePickerModal.vue'
  import { translateStatus, translateLeaveTypeName } from '@/i18n/helpers'
  

  // قائمة الأقسام تُمرَّر من الأب (AttendanceTrackerView) لأنها على الأغلب
  // قادمة من نفس مصدر قائمة الأقسام المستخدم مسبقاً بميزة Staff Management
  const props = defineProps({
    departments: { type: Array, default: () => [] }, // [{ id, name }]
  })
  
  const store = useAttendanceStore()
  const { t } = useI18n()

  // ------------------------------------------------------------------------
  // شريط الفلاتر
  // ------------------------------------------------------------------------
  const departmentOptions = computed(() => [
    { label: t('evaluations.allDepartments'), value: 'all' },
    ...props.departments.map((d) => ({ label: d.name, value: d.id })),
  ])
  
  function onDepartmentChange(value) {
    store.setFilter({ department_id: value })
  }
  function onDateChange(value) {
    store.setFilter({ date: value })
  }
  
  // ------------------------------------------------------------------------
  // شارات الحالة (مبنية على display_status الفعلي القادم من /roster: يشمل
  // الآن not_arrived و on_leave بالإضافة للفئات الخمس السابقة)
  // ------------------------------------------------------------------------
  const statusBadgeClass = {
    present: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/30',
    late: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/30',
    absent: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/30',
    early_leave: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/30',
    off_day: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/30',
    not_arrived: 'bg-slate-100 text-slate-600 dark:bg-slate-900/40 dark:text-slate-400 border-slate-200/30',
    on_leave: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-400 border-fuchsia-200/30',
  }

  function periodLabel(period) {
    return period === 'PM' ? t('attendance.pm') : t('attendance.am')
  }

  /** تنسيق وقت "YYYY-MM-DD HH:mm:ss" أو ISO كنص "hh:mm AM/PM" لعرضه بالجدول (أو "--:--" إن لم يوجد) */
  function formatTime(datetime) {
    if (!datetime) return '--:--'
    const { hours, minutes, period } = parseTimeForClock(datetime)
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${periodLabel(period)}`
  }
  

  function detailsText(rec) {
    if (rec.displayStatus === 'on_leave') return translateLeaveTypeName(rec.leaveTypeName) || t('attendance.onLeave')
    if (rec.displayStatus === 'late' && rec.lateMinutes) return t('attendance.minLate', { n: rec.lateMinutes })
    if (rec.displayStatus === 'early_leave' && rec.earlyLeaveMinutes) return t('attendance.minEarly', { n: rec.earlyLeaveMinutes })
    return t('common.emDash')
  }
  
  // ------------------------------------------------------------------------
  // مودال التعديل الاستثنائي (Exceptional Override)
  // ------------------------------------------------------------------------
  const showOverrideModal = ref(false)
  const overrideForm = ref({
    recordId: null,
    employeeId: null,
    isNewRegistration: false,
    employeeName: '',
    employeeTitle: '',
    employeeAvatar: '',
    date: '',
    checkInTime: { hours: 9, minutes: 0, period: 'AM' },
    checkOutTime: { hours: 5, minutes: 0, period: 'PM' },
    reason: '',
  })
  const overrideError = ref('')

  function openOverrideModal(record) {
    const isNewRegistration = !record.attendanceRecordId
    overrideForm.value = {
      recordId: record.attendanceRecordId,
      employeeId: record.employeeId,
      isNewRegistration,
      employeeName: record.employeeName,
      employeeTitle: record.employeeTitle,
      employeeAvatar: record.employeeAvatar,
      date: record.date || store.filters.date,
      checkInTime: record.checkIn
        ? parseTimeForClock(record.checkIn)
        : { hours: 9, minutes: 0, period: 'AM' },
      checkOutTime: record.checkOut
        ? parseTimeForClock(record.checkOut)
        : { hours: 5, minutes: 0, period: 'PM' },
      reason: '',
    }
    overrideError.value = ''
    showOverrideModal.value = true
  }
  function closeOverrideModal() {
    showOverrideModal.value = false
  }

  // -- الساعة التناظرية: تُفتح لضبط إمّا وقت الدخول أو وقت الخروج --
  const clockPickerOpen = ref(false)
  const clockPickerTarget = ref(null) // 'checkIn' | 'checkOut'

  const clockPickerValue = computed(() =>
    clockPickerTarget.value === 'checkIn' ? overrideForm.value.checkInTime : overrideForm.value.checkOutTime
  )

  function openClockFor(target) {
    clockPickerTarget.value = target
    clockPickerOpen.value = true
  }
  function onClockConfirm(value) {
    if (clockPickerTarget.value === 'checkIn') overrideForm.value.checkInTime = value
    if (clockPickerTarget.value === 'checkOut') overrideForm.value.checkOutTime = value
    clockPickerOpen.value = false
  }

  /**
   * حفظ: إن لم يكن للموظف سجل حضور بعد → POST /register،
   * وإلا → PUT /{id}/adjust.
   */
  async function submitOverride() {
    if (!overrideForm.value.reason?.trim()) {
      overrideError.value = t('validation.overrideReasonRequired')
      return
    }
    overrideError.value = ''

    const form = overrideForm.value
    let ok = false

    if (form.isNewRegistration) {
      ok = await store.registerRecord({
        employeeId: form.employeeId,
        workDate: form.date,
        checkInTime: buildLaravelDateTime(form.date, form.checkInTime),
        checkOutTime: buildLaravelDateTime(form.date, form.checkOutTime),
        reason: form.reason.trim(),
      })
    } else {
      ok = await store.adjustRecord(form.recordId, {
        newCheckIn: buildIsoDateTime(form.date, form.checkInTime),
        newCheckOut: buildIsoDateTime(form.date, form.checkOutTime),
        reason: form.reason.trim(),
      })
    }

    if (ok) closeOverrideModal()
    else if (store.errorMessage) overrideError.value = store.errorMessage
  }
  </script>
  
  <template>
    <div class="space-y-4">
      <!-- بطاقة الجدول -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <!-- شريط الفلاتر -->
        <div class="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div class="text-start">
            <h4 class="text-sm font-black text-khubrat-blue dark:text-white">{{ $t('attendance.dailyLog') }}</h4>
            <p class="text-[10px] text-slate-400">{{ $t('attendance.dailyLogHint') }}</p>
          </div>
  
          <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <BaseInput
              type="date"
              :model-value="store.filters.date"
              class="w-full sm:w-40"
              @update:model-value="onDateChange"
            />
            <BaseSelect
              :model-value="store.filters.department_id"
              :options="departmentOptions"
              class="w-full sm:w-52"
              @update:model-value="onDepartmentChange"
            />
          </div>
        </div>
  
        <BaseAlert v-if="store.errorMessage" type="error" class="m-4">
          {{ store.errorMessage }}
        </BaseAlert>
  
        <!-- الجدول -->
        <div class="overflow-x-auto">
          <table class="w-full text-start">
            <thead class="bg-slate-100/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-300 text-xs uppercase tracking-wider">
              <tr>
                <th class="p-4 pl-6">{{ $t('evaluations.employeeDetails') }}</th>
                <th class="p-4">{{ $t('staff.department') }}</th>
                <th class="p-4">{{ $t('attendance.clockIn') }}</th>
                <th class="p-4">{{ $t('attendance.clockOut') }}</th>
                <th class="p-4">{{ $t('attendance.logStatus') }}</th>
                <th class="p-4">{{ $t('common.details') }}</th>
                <th class="p-4 text-center pr-6">{{ $t('attendance.exceptionalOverride') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
              <tr v-if="store.loadingRecords">
                <td colspan="7" class="p-8 text-center">
                  <LoadingSpinner class="mx-auto" />
                </td>
              </tr>
              <tr v-else-if="store.records.length === 0">
                <td colspan="7" class="p-8 text-center text-slate-400">
                  <i class="fa-solid fa-user-slash text-2xl mb-2 block"></i>
                  {{ $t('attendance.noMatch') }}
                </td>
              </tr>
              <tr
                v-for="rec in store.records"
                :key="rec.employeeId"
                class="interactive-row hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-all"
              >
                <td class="p-4 pl-6 flex items-center gap-3">
                  <img
                    v-if="rec.employeeAvatar"
                    :src="rec.employeeAvatar"
                    class="w-8 h-8 rounded-full border border-khubrat-goldLight/20 object-cover shrink-0"
                  />
                  <div>
                    <h5 class="font-bold text-slate-800 dark:text-white text-xs">{{ rec.employeeName }}</h5>
                    <p v-if="rec.employeeTitle" class="text-[9px] text-slate-400">{{ rec.employeeTitle }}</p>
                  </div>
                </td>
                <td class="p-4 text-slate-600 dark:text-slate-300 font-semibold">{{ rec.departmentName }}</td>
                <td class="p-4 text-slate-800 dark:text-slate-200 font-extrabold">{{ formatTime(rec.checkIn) }}</td>
                <td class="p-4 text-slate-800 dark:text-slate-200 font-extrabold">{{ formatTime(rec.checkOut) }}</td>
                <td class="p-4">
                  <span
                    class="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border"
                    :class="statusBadgeClass[rec.displayStatus]"
                  >
                    {{ translateStatus(rec.displayStatus) }}
                  </span>
                </td>
                <td class="p-4 text-slate-500 dark:text-slate-400 font-semibold">{{ detailsText(rec) }}</td>
                <td class="p-4 text-center pr-6">
                  <button
                    type="button"
                    class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-khubrat-blue hover:text-white dark:bg-slate-900 dark:hover:bg-khubrat-goldLight dark:hover:text-khubrat-blue flex items-center justify-center transition-all mx-auto border border-slate-200 dark:border-slate-700"
                    :title="rec.attendanceRecordId ? $t('attendance.recordOverride') : $t('attendance.registerManual')"
                    @click="openOverrideModal(rec)"
                  >
                    <i class="fa-solid fa-user-pen"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <!-- ترقيم الصفحات (غير موجود بالتصميم الأصلي -- أُضيف لأن الباك اند يُرجع النتائج مُقسّمة) -->
        <div
          v-if="store.meta.last_page > 1"
          class="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
        >
          <span class="text-slate-400">
            {{ $t('common.pageOf', { page: store.meta.current_page, last: store.meta.last_page }) }} ({{ $t('common.employeesCount', { n: store.meta.total }) }})
          </span>
          <div class="flex gap-2">
            <BaseButton
    variant="ghost"
    :disabled="store.meta.current_page <= 1"
    @click="store.goToPage(store.meta.current_page - 1)"
  >
    {{ $t('common.previous') }}
  </BaseButton>
  <BaseButton
    variant="ghost"
    :disabled="store.meta.current_page >= store.meta.last_page"
    @click="store.goToPage(store.meta.current_page + 1)"
  >
    {{ $t('common.next') }}
  </BaseButton>
          </div>
        </div>
      </div>
  
      <!-- مودال التعديل الاستثنائي -->
      <div
        v-if="showOverrideModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        @click.self="closeOverrideModal"
      >
        <div class="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div class="p-6 bg-khubrat-blue text-white flex items-center justify-between">
            <div>
              <h3 class="font-bold text-md text-khubrat-goldLight uppercase tracking-wider">
                {{ overrideForm.isNewRegistration ? $t('attendance.manualTitle') : $t('attendance.overrideTitle') }}
              </h3>
              <p class="text-xs text-white/60">
                {{
                  overrideForm.isNewRegistration
                    ? $t('attendance.registerHint')
                    : $t('attendance.recalcHint')
                }}
              </p>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              @click="closeOverrideModal"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
  
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150">
              <img v-if="overrideForm.employeeAvatar" :src="overrideForm.employeeAvatar" class="w-10 h-10 rounded-full object-cover" />
              <div class="text-start">
                <h4 class="font-extrabold text-xs text-slate-800 dark:text-white">{{ overrideForm.employeeName }}</h4>
                <p v-if="overrideForm.employeeTitle" class="text-[10px] text-slate-400">{{ overrideForm.employeeTitle }}</p>
              </div>
            </div>
  
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase text-slate-400">{{ $t('attendance.clockInTime') }}</label>
                <div class="relative">
                  <input
                    readonly
                    type="text"
                    :value="`${String(overrideForm.checkInTime.hours).padStart(2, '0')}:${String(overrideForm.checkInTime.minutes).padStart(2, '0')} ${periodLabel(overrideForm.checkInTime.period)}`"
                    class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold dark:text-white cursor-pointer"
                    @click="openClockFor('checkIn')"
                  />
                  <i class="fa-solid fa-clock absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase text-slate-400">{{ $t('attendance.clockOutTime') }}</label>
                <div class="relative">
                  <input
                    readonly
                    type="text"
                    :value="`${String(overrideForm.checkOutTime.hours).padStart(2, '0')}:${String(overrideForm.checkOutTime.minutes).padStart(2, '0')} ${periodLabel(overrideForm.checkOutTime.period)}`"
                    class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold dark:text-white cursor-pointer"
                    @click="openClockFor('checkOut')"
                  />
                  <i class="fa-solid fa-clock absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                </div>
              </div>
            </div>
  
            <!-- حقل السبب: أُضيف لأن الباك اند يطلبه إلزامياً (422 بدونه)، ولم
                 يكن موجوداً بالتصميم الأصلي HTML -->
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase text-slate-400">
                {{ overrideForm.isNewRegistration ? $t('attendance.registrationReason') : $t('attendance.overrideReason') }} *
              </label>
              <textarea
                v-model="overrideForm.reason"
                rows="2"
                :placeholder="$t('attendance.reasonPlaceholder')"
                class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold dark:text-white focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight resize-none"
              ></textarea>
            </div>
  
            <BaseAlert v-if="overrideError" type="error">{{ overrideError }}</BaseAlert>
          </div>
  
          <div class="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
            <BaseButton variant="ghost" @click="closeOverrideModal">{{ $t('common.cancel') }}</BaseButton>
            <BaseButton variant="blue" :loading="store.isAdjusting" @click="submitOverride">
              {{ overrideForm.isNewRegistration ? $t('attendance.registerAttendance') : $t('attendance.saveOverride') }}
            </BaseButton>
          </div>
        </div>
      </div>
  
      <!-- الساعة التناظرية لاختيار الوقت (تُستدعى لكل من وقت الدخول والخروج) -->
      <ClockTimePickerModal
        :open="clockPickerOpen"
        :initial-value="clockPickerValue"
        @confirm="onClockConfirm"
        @close="clockPickerOpen = false"
      />
    </div>
  </template>
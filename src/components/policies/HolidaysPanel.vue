<script setup>
import { onMounted, ref } from 'vue'
import HolidayCalendar from './HolidayCalendar.vue'
import HolidayFormModal from './HolidayFormModal.vue'
import WeekdaySelector from './WeekdaySelector.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { formatDate } from '@/utils/format'
import { useAuthStore } from '@/stores/auth.store'
import { useHolidaysStore } from '@/stores/holidays.store'

const props = defineProps({
  readonly: { type: Boolean, default: false }
})

const authStore = useAuthStore()
const holidaysStore = useHolidaysStore()

const actionError = ref('')

const formOpen = ref(false)
const editingHoliday = ref(null)
const prefillStartDate = ref('')
const prefillEndDate = ref('')
const formLoading = ref(false)

const deleteTarget = ref(null)
const deleteLoading = ref(false)

const restDaysDraft = ref([...holidaysStore.weeklyRestDays])
const savingRestDays = ref(false)
const restDaysSuccess = ref(false)

onMounted(async () => {
  try {
    await Promise.all([
      holidaysStore.fetchHolidays(authStore.companyId),
      holidaysStore.fetchWeeklyRestDays(authStore.companyId)
    ])
    restDaysDraft.value = [...holidaysStore.weeklyRestDays]
  } catch (err) {
    actionError.value = err.message
  }
})

async function handleSeedToggle() {
  actionError.value = ''
  try {
    if (holidaysStore.isSyrianSeeded) {
      await holidaysStore.removeSyrianDefaults(authStore.companyId)
    } else {
      await holidaysStore.seedSyrianDefaults(authStore.companyId)
    }
  } catch (err) {
    actionError.value = err.message
  }
}

async function handleSaveRestDays() {
  savingRestDays.value = true
  restDaysSuccess.value = false
  actionError.value = ''
  try {
    await holidaysStore.saveWeeklyRestDays(authStore.companyId, restDaysDraft.value)
    restDaysSuccess.value = true
  } catch (err) {
    actionError.value = err.message
  } finally {
    savingRestDays.value = false
  }
}

// يفتح نافذة إنشاء عطلة جديدة؛ range اختياري قادم من نقرة/سحب على التقويم
function openCreate(range = {}) {
  editingHoliday.value = null
  prefillStartDate.value = range.startDate || ''
  prefillEndDate.value = range.endDate || range.startDate || ''
  formOpen.value = true
}

function openEdit(holiday) {
  editingHoliday.value = holiday
  prefillStartDate.value = ''
  prefillEndDate.value = ''
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  editingHoliday.value = null
  prefillStartDate.value = ''
  prefillEndDate.value = ''
}

async function handleSaveHoliday(payload) {
  formLoading.value = true
  actionError.value = ''
  try {
    if (editingHoliday.value) {
      await holidaysStore.updateHoliday(authStore.companyId, editingHoliday.value.id, payload)
    } else {
      await holidaysStore.createHoliday(authStore.companyId, payload)
    }
    closeForm()
  } catch (err) {
    actionError.value = err.message
  } finally {
    formLoading.value = false
  }
}

function askDelete(holiday) {
  deleteTarget.value = holiday
}

async function confirmDelete() {
  deleteLoading.value = true
  actionError.value = ''
  try {
    await holidaysStore.removeHoliday(authStore.companyId, deleteTarget.value.id)
    deleteTarget.value = null
  } catch (err) {
    actionError.value = err.message
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <BaseAlert v-if="actionError" variant="error">{{ actionError }}</BaseAlert>

    <!-- Syrian defaults seeder -->
    <div v-if="!readonly" class="bg-gradient-to-r from-[#002173] to-[#001037] text-white p-6 rounded-3xl relative overflow-hidden shadow-lg border border-khubrat-goldLight/20 gold-glow">
      <div class="absolute right-4 bottom-0 opacity-10 pointer-events-none transform translate-y-6 translate-x-12">
        <i class="fa-solid fa-calendar-days text-[180px]"></i>
      </div>
      <div class="max-w-2xl space-y-3 relative">
        <h3 class="text-lg font-extrabold text-khubrat-goldLight">Syrian National Holidays Quick Import</h3>
        <p class="text-xs text-slate-200 leading-relaxed">
          Pre-populate your official corporate policy calendar instantly. Seed fixed sovereign holidays into your
          scheduler, or remove them dynamically using the toggle trigger below.
        </p>
        <button
          class="font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all duration-200 transform active:scale-95 shadow-md"
          :class="holidaysStore.isSyrianSeeded ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-khubrat-goldLight hover:bg-white text-[#002173]'"
          :disabled="holidaysStore.seeding"
          @click="handleSeedToggle"
        >
          <i class="fa-solid" :class="holidaysStore.seeding ? 'fa-spinner animate-spin' : holidaysStore.isSyrianSeeded ? 'fa-trash-can' : 'fa-cloud-arrow-down'"></i>
          {{ holidaysStore.isSyrianSeeded ? 'Remove Syrian Holidays' : 'Seed Default Syrian Holidays' }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <!-- Calendar workspace -->
      <div class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div class="flex justify-between items-center gap-3">
            <div class="flex-1">
              <WeekdaySelector v-model="restDaysDraft" label="Weekly Rest Days Configuration" :readonly="readonly" />
            </div>
            <BaseButton v-if="!readonly" variant="blue" :loading="savingRestDays" @click="handleSaveRestDays">Save</BaseButton>
          </div>
          <BaseAlert v-if="restDaysSuccess" variant="success">Weekly rest days saved successfully.</BaseAlert>
        </div>

        <div v-if="!readonly" class="p-3 bg-khubrat-blue/5 dark:bg-slate-900/40 border border-khubrat-blue/10 dark:border-slate-800 text-xs rounded-xl flex items-center gap-2 text-khubrat-blue dark:text-khubrat-goldLight">
          <i class="fa-solid fa-circle-info"></i>
          <span><strong>Interactive Selection:</strong> Click a single date, or press and drag across several days, to add a holiday policy for that range.</span>
        </div>

        <LoadingSpinner v-if="holidaysStore.loading && !holidaysStore.holidays.length" label="Loading calendar…" />
        <HolidayCalendar
          v-else
          :holidays="holidaysStore.holidays"
          :weekly-rest-days="holidaysStore.weeklyRestDays"
          :readonly="readonly"
          @select-range="openCreate"
        />
      </div>

      <!-- Holiday directory -->
      <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div>
            <h4 class="text-sm font-black text-khubrat-blue dark:text-white">Holiday Timeline Directory</h4>
            <p class="text-[10px] text-slate-400">Chronological list of all custom and imported holidays.</p>
          </div>
          <button
            v-if="!readonly"
            class="w-8 h-8 rounded-lg bg-khubrat-blue hover:bg-opacity-90 dark:bg-khubrat-goldLight dark:text-khubrat-blue text-white flex items-center justify-center transition-all"
            @click="openCreate()"
          >
            <i class="fa-solid fa-plus text-xs"></i>
          </button>
        </div>

        <div v-if="!holidaysStore.holidays.length" class="text-center text-xs font-semibold text-slate-400 py-10">
          No holidays configured yet.
        </div>

        <div v-else class="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          <div
            v-for="h in [...holidaysStore.holidays].sort((a, b) => new Date(a.start_date) - new Date(b.start_date))"
            :key="h.id"
            class="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2 hover:shadow-sm transition-all"
          >
            <div class="space-y-0.5">
              <p class="text-xs font-black text-khubrat-blue dark:text-khubrat-goldLight">{{ h.name }}</p>
              <p class="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                <i class="fa-solid fa-calendar-day mr-1"></i>
                {{ h.start_date === h.end_date ? formatDate(h.start_date) : `${formatDate(h.start_date)} – ${formatDate(h.end_date)}` }}
              </p>
              <p class="text-[9px] font-bold" :class="h.repeats_annually ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'">
                <i class="fa-solid fa-arrows-rotate mr-1"></i>
                {{ h.repeats_annually ? 'Repeats annually' : 'One-off' }}
              </p>
            </div>
            <div v-if="!readonly" class="flex gap-1">
              <button
                class="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] rounded-lg hover:bg-slate-50"
                @click="openEdit(h)"
              >
                <i class="fa-solid fa-pen"></i>
              </button>
              <button
                class="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-[10px] rounded-lg hover:bg-rose-100"
                @click="askDelete(h)"
              >
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <HolidayFormModal
      v-if="formOpen"
      :holiday="editingHoliday"
      :initial-start-date="prefillStartDate"
      :initial-end-date="prefillEndDate"
      :loading="formLoading"
      @save="handleSaveHoliday"
      @cancel="closeForm"
    />

    <ConfirmModal
      v-if="deleteTarget"
      title="Delete Holiday"
      confirm-label="Delete Permanently"
      confirm-variant="danger"
      :loading="deleteLoading"
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    >
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Purge <strong>{{ deleteTarget?.name }}</strong> from the corporate calendar agenda?
      </p>
    </ConfirmModal>
  </div>
</template>
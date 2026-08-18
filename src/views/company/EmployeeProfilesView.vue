<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStaffStore } from '@/stores/staff.store'
import { useSalariesStore } from '@/stores/salaries.store'
import { employeesService } from '@/services/employees.service'
import { formatCurrency, formatDate, initials, toMediaUrl } from '@/utils/format'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const { t } = useI18n()
const staffStore = useStaffStore()
const salariesStore = useSalariesStore()

const searchQuery = ref('')
const filterDept = ref('all')
const filterStatus = ref('active')
const selectedEmployee = ref(null)
const profileData = ref(null)
const profileLoading = ref(false)
const showSalaryModal = ref(false)
const salaryError = ref(null)
const downloadingDoc = ref(null)
const documentDownloadError = ref(null)

onMounted(async () => {
  await Promise.all([staffStore.fetchDirectory(), staffStore.fetchDepartments()])
})

function normalizeEvaluationRatings(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.map((item, idx) => {
      if (typeof item === 'number') {
        return { label: `#${idx + 1}`, score: item }
      }
      if (typeof item !== 'object' || !item) {
        const score = Number(item)
        return { label: `#${idx + 1}`, score: Number.isFinite(score) ? score : 0 }
      }

      const period = item.period ?? item.evaluation_period ?? item.cycle
      let label = item.period_name || item.label || item.name || `#${idx + 1}`

      if (typeof period === 'string') {
        label = period
      } else if (period && typeof period === 'object') {
        label =
          period.name ||
          period.label ||
          period.title ||
          [period.month, period.year].filter(Boolean).join('/') ||
          label
      } else if (item.month || item.year) {
        label = [item.month, item.year].filter(Boolean).join('/')
      }

      const score = Number(
        item.final_score ?? item.score ?? item.rating ?? item.average_score ?? item.value ?? 0
      )

      return { label, score: Number.isFinite(score) ? score : 0 }
    })
  }

  if (typeof raw === 'object') {
    return Object.entries(raw).map(([key, val]) => ({
      label: key,
      score:
        typeof val === 'object'
          ? Number(val?.final_score ?? val?.score ?? val?.rating ?? 0)
          : Number(val) || 0
    }))
  }

  return []
}

const filteredStaff = computed(() => {
  let list = staffStore.sortedStaff
  if (filterStatus.value === 'active') list = list.filter((s) => s.is_active)
  else if (filterStatus.value === 'inactive') list = list.filter((s) => !s.is_active)
  if (filterDept.value !== 'all') list = list.filter((s) => s.department_id === filterDept.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      (s) =>
        (s.full_name || '').toLowerCase().includes(q) ||
        (s.job_title || '').toLowerCase().includes(q)
    )
  }
  return list
})

async function selectEmployee(emp) {
  selectedEmployee.value = emp
  profileLoading.value = true
  profileData.value = null
  documentDownloadError.value = null
  try {
    const data = await employeesService.profileOverview(emp.id)
    profileData.value = data
  } catch {
    profileData.value = null
  } finally {
    profileLoading.value = false
  }
}

async function openSalaryHistory() {
  const employeeId = personalInfo.value?.id ?? selectedEmployee.value?.id
  if (!employeeId) return
  showSalaryModal.value = true
  salaryError.value = null
  try {
    await salariesStore.fetchEmployeeHistory(employeeId)
  } catch (err) {
    salaryError.value = err?.message || t('common.tryAgain')
  }
}

function closeSalaryModal() {
  showSalaryModal.value = false
  salaryError.value = null
}

async function downloadDocument(rawUrl, fallbackName) {
  if (!rawUrl || downloadingDoc.value) return

  downloadingDoc.value = fallbackName
  documentDownloadError.value = null

  try {
    await employeesService.downloadStorageFile(rawUrl, fallbackName)
  } catch (err) {
    documentDownloadError.value = err?.message || t('common.tryAgain')
  } finally {
    downloadingDoc.value = null
  }
}

const personalInfo = computed(() => profileData.value?.personal_info ?? null)
const evaluationRatings = computed(() =>
  normalizeEvaluationRatings(profileData.value?.evaluation_ratings)
)
const attendanceHistory = computed(() => profileData.value?.attendance_history ?? null)
const attendanceSummary = computed(() => attendanceHistory.value?.summary ?? null)

const chartPoints = computed(() => {
  const ratings = evaluationRatings.value
  if (!ratings.length) return []
  const step = ratings.length > 1 ? 260 / (ratings.length - 1) : 0
  return ratings.map((rating, idx) => {
    const clamped = Math.min(10, Math.max(0, rating.score))
    return {
      x: 20 + idx * step,
      y: 90 - clamped * 7,
      score: clamped,
      label: rating.label
    }
  })
})

const chartLinePath = computed(() => {
  if (!chartPoints.value.length) return ''
  return chartPoints.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
})

const chartLineColor = computed(() => {
  const last = chartPoints.value.at(-1)?.score ?? 0
  if (last >= 8.5) return '#10b981'
  if (last >= 5) return '#f59e0b'
  return '#ef4444'
})

function pointColor(score) {
  if (score < 5) return '#f43f5e'
  if (score < 8.5) return '#f59e0b'
  return '#10b981'
}

function salaryPeriod(record) {
  if (record.period) return record.period
  if (record.month_name && record.year) return `${record.month_name} ${record.year}`
  if (record.month && record.year) return `${record.month}/${record.year}`
  return t('common.emDash')
}

function salaryAmount(record, keys, fallback = 0) {
  for (const key of keys) {
    const value = record?.[key]
    if (value !== null && value !== undefined && value !== '') return Number(value) || 0
  }
  return fallback
}

function statusBadge(isActive) {
  return isActive
    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

function genderLabel(g) {
  if (!g) return t('common.notSpecified')
  return g === 'male' ? t('employeeProfiles.male') : t('employeeProfiles.female')
}

function maritalLabel(m) {
  if (!m) return t('common.notSpecified')
  const map = { single: t('employeeProfiles.single'), married: t('employeeProfiles.married'), divorced: t('employeeProfiles.divorced'), widowed: t('employeeProfiles.widowed') }
  return map[m] ?? m
}

function empTypeLabel(et) {
  if (!et) return t('common.notSpecified')
  return et === 'full-time' ? t('employeeProfiles.fullTime') : t('employeeProfiles.partTime')
}
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

      <!-- Left Panel: Employee Directory -->
      <div class="space-y-6 lg:col-span-1">
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div class="border-b border-slate-150 dark:border-slate-700 pb-3">
            <h4 class="text-sm font-black text-khubrat-blue dark:text-white">{{ t('employeeProfiles.directory') }}</h4>
            <p class="text-[10px] text-slate-400">{{ t('employeeProfiles.directoryHint') }}</p>
          </div>

          <div class="space-y-3">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('employeeProfiles.searchPlaceholder')"
                class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl ps-10 pe-4 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
              />
              <i class="fa-solid fa-magnifying-glass absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            </div>
            <div class="relative">
              <select
                v-model="filterDept"
                class="appearance-none w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white cursor-pointer transition-all"
              >
                <option value="all">{{ t('common.all') }} {{ t('staff.departments') }}</option>
                <option v-for="dept in staffStore.departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
              </select>
              <i class="fa-solid fa-filter absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
            </div>
            <div class="relative">
              <select
                v-model="filterStatus"
                class="appearance-none w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white cursor-pointer transition-all"
              >
                <option value="all">{{ t('employeeProfiles.allStatuses') }}</option>
                <option value="active">{{ t('status.active') }}</option>
                <option value="inactive">{{ t('status.inactive') }}</option>
              </select>
              <i class="fa-solid fa-users absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
            </div>
          </div>

          <LoadingSpinner v-if="staffStore.loading" />

          <div v-else class="space-y-2 max-h-[400px] overflow-y-auto pe-1">
            <button
              v-for="emp in filteredStaff"
              :key="emp.id"
              class="interactive-row w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-start"
              :class="selectedEmployee?.id === emp.id
                ? 'border-khubrat-goldLight bg-khubrat-blue/5 dark:bg-khubrat-goldLight/10'
                : 'border-slate-100 dark:border-slate-700 hover:border-khubrat-goldLight/50'"
              @click="selectEmployee(emp)"
            >
              <div class="w-9 h-9 rounded-full bg-khubrat-blue/10 dark:bg-khubrat-goldLight/10 flex items-center justify-center text-xs font-black text-khubrat-blue dark:text-khubrat-goldLight flex-shrink-0">
                {{ initials(emp.full_name) }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-slate-800 dark:text-white truncate">{{ emp.full_name }}</p>
                <p class="text-[10px] text-slate-400 truncate">{{ emp.job_title || t('common.notSpecified') }}</p>
              </div>
              <span
                class="px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest flex-shrink-0"
                :class="statusBadge(emp.is_active)"
              >
                {{ emp.is_active ? t('status.active') : t('status.inactive') }}
              </span>
            </button>

            <p v-if="!filteredStaff.length && !staffStore.loading" class="text-center text-xs text-slate-400 py-6">
              {{ t('employeeProfiles.noResults') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Right Panel: Profile Details -->
      <div v-if="selectedEmployee" class="lg:col-span-2 space-y-6">

        <LoadingSpinner v-if="profileLoading" />

        <template v-else-if="personalInfo">
          <!-- Master Profile Card -->
          <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col md:flex-row gap-6 p-6 items-start">
            <div class="flex flex-col items-center text-center w-full md:w-1/3 shrink-0 p-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-slate-700">
              <img
                v-if="personalInfo.documents?.profile_image_url"
                :src="toMediaUrl(personalInfo.documents.profile_image_url)"
                class="w-24 h-24 rounded-full border-2 border-khubrat-blue dark:border-khubrat-goldLight object-cover shadow-sm mb-3"
                :alt="personalInfo.full_name"
              />
              <div v-else class="w-24 h-24 rounded-full border-2 border-khubrat-blue dark:border-khubrat-goldLight bg-khubrat-blue/10 dark:bg-khubrat-goldLight/10 flex items-center justify-center text-2xl font-black text-khubrat-blue dark:text-khubrat-goldLight mb-3">
                {{ initials(personalInfo.full_name) }}
              </div>
              <h3 class="font-extrabold text-slate-900 dark:text-white text-base">{{ personalInfo.full_name }}</h3>
              <p class="text-xs text-slate-400 font-bold mb-2">{{ personalInfo.job_title || t('common.notSpecified') }}</p>
              <span
                class="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest"
                :class="statusBadge(personalInfo.is_active)"
              >
                {{ personalInfo.is_active ? t('status.active') : t('status.inactive') }}
              </span>

              <!-- Documents -->
              <div
                v-if="personalInfo.documents?.identity_image_url || personalInfo.documents?.university_certificate_url"
                class="mt-4 w-full space-y-2"
              >
                <p v-if="documentDownloadError" class="text-[10px] text-rose-500 font-bold">{{ documentDownloadError }}</p>
                <button
                  v-if="personalInfo.documents?.identity_image_url"
                  type="button"
                  class="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-khubrat-blue dark:text-khubrat-goldLight flex items-center justify-center gap-2 hover:border-khubrat-goldDark transition-all disabled:opacity-60"
                  :disabled="downloadingDoc === 'identity-document'"
                  @click="downloadDocument(personalInfo.documents.identity_image_url, 'identity-document')"
                >
                  <i class="fa-solid" :class="downloadingDoc === 'identity-document' ? 'fa-spinner fa-spin' : 'fa-id-card'"></i>
                  {{ t('employeeProfiles.identityDoc') }}
                </button>
                <button
                  v-if="personalInfo.documents?.university_certificate_url"
                  type="button"
                  class="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-khubrat-blue dark:text-khubrat-goldLight flex items-center justify-center gap-2 hover:border-khubrat-goldDark transition-all disabled:opacity-60"
                  :disabled="downloadingDoc === 'university-certificate'"
                  @click="downloadDocument(personalInfo.documents.university_certificate_url, 'university-certificate')"
                >
                  <i class="fa-solid" :class="downloadingDoc === 'university-certificate' ? 'fa-spinner fa-spin' : 'fa-graduation-cap'"></i>
                  {{ t('employeeProfiles.universityCertificate') }}
                </button>
              </div>
            </div>

            <!-- Personal Details Grid -->
            <div class="flex-1 w-full space-y-4">
              <div class="border-b border-slate-150 dark:border-slate-700 pb-2">
                <h4 class="text-xs font-black text-slate-700 dark:text-khubrat-goldLight uppercase tracking-wider">{{ t('employeeProfiles.personalLedger') }}</h4>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <div class="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between">
                  <span class="text-slate-400">{{ t('employeeProfiles.email') }}:</span>
                  <span class="text-slate-900 dark:text-white truncate max-w-[140px]">{{ personalInfo.email || t('common.emDash') }}</span>
                </div>
                <div class="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between">
                  <span class="text-slate-400">{{ t('employeeProfiles.phone') }}:</span>
                  <span class="text-slate-900 dark:text-white">{{ personalInfo.phone || t('common.emDash') }}</span>
                </div>
                <div class="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between">
                  <span class="text-slate-400">{{ t('employeeProfiles.gender') }}:</span>
                  <span class="text-slate-900 dark:text-white">{{ genderLabel(personalInfo.gender) }}</span>
                </div>
                <div class="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between">
                  <span class="text-slate-400">{{ t('employeeProfiles.maritalStatus') }}:</span>
                  <span class="text-slate-900 dark:text-white">{{ maritalLabel(personalInfo.marital_status) }}</span>
                </div>
                <div class="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between">
                  <span class="text-slate-400">{{ t('employeeProfiles.nationality') }}:</span>
                  <span class="text-slate-900 dark:text-white">{{ personalInfo.nationality || t('common.emDash') }}</span>
                </div>
                <div class="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between">
                  <span class="text-slate-400">{{ t('employeeProfiles.residence') }}:</span>
                  <span class="text-slate-900 dark:text-white truncate max-w-[140px]">{{ personalInfo.residence || t('common.emDash') }}</span>
                </div>
                <div class="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between">
                  <span class="text-slate-400">{{ t('employeeProfiles.birthDate') }}:</span>
                  <span class="text-slate-900 dark:text-white">{{ formatDate(personalInfo.birth_date) }}</span>
                </div>
                <div class="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between">
                  <span class="text-slate-400">{{ t('employeeProfiles.department') }}:</span>
                  <span class="text-khubrat-blue dark:text-khubrat-goldLight">{{ personalInfo.department?.name || t('common.emDash') }}</span>
                </div>
                <div class="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between">
                  <span class="text-slate-400">{{ t('employeeProfiles.employment') }}:</span>
                  <span class="text-khubrat-blue dark:text-khubrat-goldLight">{{ empTypeLabel(personalInfo.employment_type) }}</span>
                </div>
                <div class="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between">
                  <span class="text-slate-400">{{ t('employeeProfiles.baseSalary') }}:</span>
                  <span class="text-slate-900 dark:text-white">{{ formatCurrency(personalInfo.base_salary) }}</span>
                </div>
                <div class="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between">
                  <span class="text-slate-400">{{ t('employeeProfiles.education') }}:</span>
                  <span class="text-slate-900 dark:text-white">{{ personalInfo.education || t('common.emDash') }}</span>
                </div>
                <div class="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between">
                  <span class="text-slate-400">{{ t('employeeProfiles.hireDate') }}:</span>
                  <span class="text-slate-900 dark:text-white">{{ formatDate(personalInfo.hire_date) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Evaluation Ratings + Salary Action -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Evaluation Ratings -->
            <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div class="border-b border-slate-100 dark:border-slate-700 pb-2">
                <h4 class="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">{{ t('employeeProfiles.evalTrend') }}</h4>
                <p class="text-[10px] text-slate-400">{{ t('employeeProfiles.evalTrendHint') }}</p>
              </div>

              <div v-if="chartPoints.length" class="space-y-3">
                <div class="relative w-full h-36 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
                  <svg viewBox="0 0 300 100" class="w-full h-full">
                    <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" stroke-width="0.5" class="dark:stroke-slate-800" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="#f1f5f9" stroke-width="0.5" class="dark:stroke-slate-800" />
                    <line x1="0" y1="80" x2="300" y2="80" stroke="#f1f5f9" stroke-width="0.5" class="dark:stroke-slate-800" />
                    <path
                      :d="chartLinePath"
                      fill="none"
                      :stroke="chartLineColor"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <g v-for="(point, idx) in chartPoints" :key="idx">
                      <circle :cx="point.x" :cy="point.y" r="5" :fill="pointColor(point.score)" />
                      <text
                        :x="point.x"
                        :y="point.y - 10"
                        text-anchor="middle"
                        class="text-[8px] font-black"
                        fill="currentColor"
                      >
                        {{ point.score.toFixed(1) }}
                      </text>
                    </g>
                  </svg>
                </div>
                <div class="flex flex-wrap justify-between gap-2 text-[8px] font-black text-slate-400 uppercase px-1">
                  <span v-for="(rating, idx) in evaluationRatings" :key="idx" class="truncate max-w-[4rem]">
                    {{ rating.label }}
                  </span>
                </div>
              </div>
              <p v-else class="text-xs text-slate-400 text-center py-4">{{ t('employeeProfiles.noEvaluations') }}</p>
            </div>

            <!-- Salary Ledger Trigger -->
            <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <div class="space-y-2 text-start">
                <div class="flex items-center gap-2 text-khubrat-blue dark:text-khubrat-goldLight">
                  <i class="fa-solid fa-receipt text-lg"></i>
                  <h4 class="text-xs font-black uppercase tracking-wider">{{ t('employeeProfiles.salaryLedger') }}</h4>
                </div>
                <p class="text-[11px] text-slate-400 leading-relaxed">{{ t('employeeProfiles.salaryLedgerHint') }}</p>
              </div>
              <button
                class="w-full mt-4 py-2.5 bg-khubrat-blue dark:bg-khubrat-goldLight text-white dark:text-khubrat-blue font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-sm"
                @click="openSalaryHistory"
              >
                <i class="fa-solid fa-receipt"></i>
                <span>{{ t('employeeProfiles.viewSalaryRecords') }}</span>
              </button>
            </div>
          </div>

          <!-- Attendance Summary -->
          <div v-if="attendanceSummary" class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div class="border-b border-slate-100 dark:border-slate-700 pb-2">
              <h4 class="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wider">{{ t('employeeProfiles.attendanceSummary') }}</h4>
              <p class="text-[10px] text-slate-400">
                {{ formatDate(attendanceHistory.from) }} — {{ formatDate(attendanceHistory.to) }}
              </p>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
              <div class="p-3 bg-emerald-500/10 rounded-xl">
                <span class="text-lg font-black text-emerald-600 dark:text-emerald-400 block">{{ attendanceSummary.present_days }}</span>
                <span class="text-[9px] font-bold text-slate-500 uppercase">{{ t('employeeProfiles.present') }}</span>
              </div>
              <div class="p-3 bg-amber-500/10 rounded-xl">
                <span class="text-lg font-black text-amber-600 dark:text-amber-400 block">{{ attendanceSummary.late_days }}</span>
                <span class="text-[9px] font-bold text-slate-500 uppercase">{{ t('employeeProfiles.late') }}</span>
              </div>
              <div class="p-3 bg-orange-500/10 rounded-xl">
                <span class="text-lg font-black text-orange-600 dark:text-orange-400 block">{{ attendanceSummary.early_leave_days }}</span>
                <span class="text-[9px] font-bold text-slate-500 uppercase">{{ t('employeeProfiles.earlyLeave') }}</span>
              </div>
              <div class="p-3 bg-rose-500/10 rounded-xl">
                <span class="text-lg font-black text-rose-600 dark:text-rose-400 block">{{ attendanceSummary.absent_days }}</span>
                <span class="text-[9px] font-bold text-slate-500 uppercase">{{ t('employeeProfiles.absent') }}</span>
              </div>
              <div class="p-3 bg-blue-500/10 rounded-xl">
                <span class="text-lg font-black text-blue-600 dark:text-blue-400 block">{{ attendanceSummary.leave_days }}</span>
                <span class="text-[9px] font-bold text-slate-500 uppercase">{{ t('employeeProfiles.leaveDays') }}</span>
              </div>
              <div class="p-3 bg-indigo-500/10 rounded-xl">
                <span class="text-lg font-black text-indigo-600 dark:text-indigo-400 block">{{ attendanceSummary.holiday_occurrences }}</span>
                <span class="text-[9px] font-bold text-slate-500 uppercase">{{ t('employeeProfiles.holidays') }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Empty State -->
      <div v-else class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-16 border border-slate-200 dark:border-slate-700 text-center shadow-sm text-slate-400">
        <i class="fa-solid fa-address-card text-5xl mb-3 block text-khubrat-goldDark/30"></i>
        <p class="font-extrabold text-sm">{{ t('employeeProfiles.noSelection') }}</p>
        <p class="text-xs text-slate-400 mt-1">{{ t('employeeProfiles.noSelectionHint') }}</p>
      </div>
    </div>

    <!-- Salary History Modal -->
    <Teleport to="body">
      <div
        v-if="showSalaryModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="closeSalaryModal"
      >
        <div class="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div class="p-6 bg-khubrat-blue text-white flex items-center justify-between">
            <div>
              <h3 class="font-bold text-md text-khubrat-goldLight uppercase tracking-wider">{{ t('employeeProfiles.salaryLedger') }}</h3>
              <p class="text-xs text-white/60">{{ personalInfo?.full_name }}</p>
            </div>
            <button class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center" @click="closeSalaryModal">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="p-6 space-y-4 overflow-x-auto max-h-[60vh] overflow-y-auto">
            <LoadingSpinner v-if="salariesStore.employeeHistoryLoading" />
            <p v-else-if="salaryError" class="text-center text-xs text-rose-500 py-8">{{ salaryError }}</p>
            <template v-else-if="salariesStore.employeeHistory.length">
              <table class="w-full text-left text-xs border-collapse min-w-[720px]">
                <thead>
                  <tr class="text-slate-800 dark:text-slate-100 border-b-2 border-slate-200 dark:border-slate-700 font-extrabold text-[11px]">
                    <th class="pb-3 ps-4">{{ t('employeeProfiles.salMonth') }}</th>
                    <th class="pb-3 px-2">{{ t('employeeProfiles.salBase') }}</th>
                    <th class="pb-3 px-2 text-emerald-600">{{ t('employeeProfiles.salOvertime') }}</th>
                    <th class="pb-3 px-2 text-emerald-600">{{ t('employeeProfiles.salBonus') }}</th>
                    <th class="pb-3 px-2 text-rose-500">{{ t('employeeProfiles.salLate') }}</th>
                    <th class="pb-3 px-2 text-rose-500">{{ t('employeeProfiles.salAbsent') }}</th>
                    <th class="pb-3 px-2 text-rose-500">{{ t('employeeProfiles.salLoan') }}</th>
                    <th class="pb-3 px-2 text-emerald-600">{{ t('employeeProfiles.salManualBonus') }}</th>
                    <th class="pb-3 px-2 text-rose-500">{{ t('employeeProfiles.salManualDeduct') }}</th>
                    <th class="pb-3 pe-4 text-end font-black">{{ t('employeeProfiles.salNet') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 dark:divide-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                  <tr
                    v-for="(sal, idx) in salariesStore.employeeHistory"
                    :key="sal.id ?? `${sal.month}-${sal.year}-${idx}`"
                    class="interactive-row"
                  >
                    <td class="py-3 ps-4 font-extrabold text-khubrat-blue dark:text-khubrat-goldLight">{{ salaryPeriod(sal) }}</td>
                    <td class="py-3 px-2">{{ formatCurrency(salaryAmount(sal, ['base_salary', 'base', 'basic_salary'])) }}</td>
                    <td class="py-3 px-2 text-emerald-600">{{ formatCurrency(salaryAmount(sal, ['overtime_pay', 'overtime', 'overtime_amount'])) }}</td>
                    <td class="py-3 px-2 text-emerald-600">{{ formatCurrency(salaryAmount(sal, ['bonus'])) }}</td>
                    <td class="py-3 px-2 text-rose-500">{{ formatCurrency(salaryAmount(sal, ['late_deduction', 'late', 'late_deduct'])) }}</td>
                    <td class="py-3 px-2 text-rose-500">{{ formatCurrency(salaryAmount(sal, ['absent_deduction', 'absent', 'absent_deduct'])) }}</td>
                    <td class="py-3 px-2 text-rose-500">{{ formatCurrency(salaryAmount(sal, ['loan_deduction', 'loan', 'loan_deduct'])) }}</td>
                    <td class="py-3 px-2 text-emerald-600">{{ formatCurrency(salaryAmount(sal, ['manual_bonus', 'm_bonus', 'mBonus'])) }}</td>
                    <td class="py-3 px-2 text-rose-500">{{ formatCurrency(salaryAmount(sal, ['manual_deduction', 'm_deduction', 'mDeduct'])) }}</td>
                    <td class="py-3 pe-4 text-end font-black text-slate-900 dark:text-white">{{ formatCurrency(salaryAmount(sal, ['net_salary', 'net'])) }}</td>
                  </tr>
                </tbody>
              </table>
            </template>
            <p v-else class="text-center text-xs text-slate-400 py-8">{{ t('employeeProfiles.noSalaryRecords') }}</p>
          </div>

          <div class="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end">
            <button class="px-5 py-2.5 bg-khubrat-blue dark:bg-khubrat-goldLight text-white dark:text-khubrat-blue text-xs font-bold rounded-xl hover:opacity-90" @click="closeSalaryModal">
              {{ t('common.close') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEvaluationsStore } from '@/stores/useEvaluationsStore'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const props = defineProps({
  cycleId: { type: [String, Number], default: null }
})

const evaluationsStore = useEvaluationsStore()
const { t, te } = useI18n()

const searchName = ref('')
const filterDept = ref('all')
const selectedEmployeeId = ref(null)
const finalResultForSelected = ref(null)

// تحميل قائمة الموظفين الجاهزين للتصحيح ونتائج الدورة الإجمالية
async function loadScoringData() {
  if (!props.cycleId) return
  await Promise.all([
    evaluationsStore.fetchScorableEmployees(props.cycleId),
    evaluationsStore.fetchFinalResults(props.cycleId)
  ])
}
onMounted(loadScoringData)
watch(() => props.cycleId, loadScoringData)

function empId(emp) {
  // Scorable rows use employee record id; final-results use employee_id
  return emp?.employee_id ?? emp?.employee?.id ?? emp?.id
}

/**
 * Scorable: { user: { full_name } }
 * Final results: { employee: { full_name } }
 */
function empName(emp) {
  return (
    emp?.user?.full_name ||
    emp?.employee?.full_name ||
    emp?.full_name ||
    emp?.employee_name ||
    emp?.name ||
    ''
  )
}

function departmentName(emp) {
  if (typeof emp?.department === 'string') return emp.department
  return (
    emp?.department?.name ||
    emp?.department_name ||
    emp?.employee?.department?.name ||
    emp?.dept ||
    ''
  )
}

function jobTitle(emp) {
  return emp?.job_title || emp?.employee?.job_title || ''
}

/** Subtitle under the name: "Job Title · Department" (strings only — never objects). */
function empSubtitle(emp) {
  const parts = [jobTitle(emp), departmentName(emp)].filter(Boolean)
  return parts.join(' · ')
}

function initials(name = '') {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatScore(value) {
  if (value === null || value === undefined || value === '') return t('common.emDash')
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(2) : String(value)
}

function displayRating(value) {
  if (!value) return t('common.emDash')
  const key = `evaluations.${String(value).toLowerCase()}`
  return te(key) ? t(key) : value
}

const departmentOptions = computed(() => {
  const list = Array.isArray(evaluationsStore.scorableEmployees)
    ? evaluationsStore.scorableEmployees
    : []
  const depts = [...new Set(list.map(departmentName).filter(Boolean))]
  return [{ value: 'all', label: t('evaluations.allDepartments') }, ...depts.map((d) => ({ value: d, label: d }))]
})

const filteredEmployees = computed(() => {
  const list = Array.isArray(evaluationsStore.scorableEmployees)
    ? evaluationsStore.scorableEmployees
    : []
  return list.filter((emp) => {
    const matchesSearch = empName(emp).toLowerCase().includes(searchName.value.toLowerCase())
    const matchesDept = filterDept.value === 'all' || departmentName(emp) === filterDept.value
    return matchesSearch && matchesDept
  })
})

// اختيار موظف من القائمة وجلب تفاصيل تصحيحه + نتيجته إن وُجدت
async function selectEmployee(id) {
  selectedEmployeeId.value = id
  finalResultForSelected.value = null
  await evaluationsStore.fetchScoringDetails(props.cycleId, { employee_id: id })
  try {
    finalResultForSelected.value = await evaluationsStore.fetchEmployeeFinalResult(props.cycleId, id)
  } catch {
    finalResultForSelected.value = null
  }
}

const selectedEmployee = computed(() => {
  const list = Array.isArray(evaluationsStore.scorableEmployees)
    ? evaluationsStore.scorableEmployees
    : []
  return list.find((e) => empId(e) === selectedEmployeeId.value) || null
})
/** GET /scoring يعيد مصفوفة مراجعات: كل عنصر ورقة تقييم (self / manager / peer). */
const sheets = computed(() =>
  Array.isArray(evaluationsStore.scoringDetails) ? evaluationsStore.scoringDetails : []
)

function sheetLabel(sheet) {
  const key = `evaluations.${sheet?.review_type}Review`
  if (sheet?.review_type && te(key)) return t(key)
  return sheet?.review_type || t('evaluations.review')
}

/** الأسئلة القابلة لوضع درجة HR هي من نوع rating فقط. */
function ratingAnswers(sheet) {
  return (sheet?.answers || []).filter((ans) => ans?.question?.response_type === 'rating')
}

/** الورقة مصححة عندما يعيد الباك اند total_score لها. */
function isSheetGraded(sheet) {
  return sheet?.total_score !== null && sheet?.total_score !== undefined
}

function sheetAverage(sheet) {
  return isSheetGraded(sheet) ? Number(sheet.total_score).toFixed(1) : '0.0'
}

const allSheetsGraded = computed(
  () => sheets.value.length > 0 && sheets.value.every(isSheetGraded)
)

// ================= درج تصحيح الورقة =================
const gradingSheet = ref(null)
const draftScores = reactive({})

const gradingAnswers = computed(() => gradingSheet.value?.answers || [])

function openGradingDrawer(sheet) {
  gradingSheet.value = sheet
  Object.keys(draftScores).forEach((key) => delete draftScores[key])
  // ratingAnswers(sheet).forEach((ans) => {
  //   draftScores[ans.id] = ans.hr_score ?? null
  // })
  ;(sheet?.answers || []).forEach((ans) => {
    draftScores[ans.id] = ans.hr_score ?? null
  })
}

function closeGradingDrawer() {
  gradingSheet.value = null
}

/** كل درجة يجب أن تكون رقماً بين 0 و 10 قبل الإرسال. */
const canSubmitSheet = computed(() => {
  const answers = ratingAnswers(gradingSheet.value)
  if (!answers.length) return false
  return answers.every((ans) => {
    const value = draftScores[ans.id]
    if (value === null || value === undefined || value === '') return false
    const n = Number(value)
    return Number.isFinite(n) && n >= 0 && n <= 10
  })
})

async function submitGradedSheet() {
  const sheet = gradingSheet.value
  if (!sheet || !canSubmitSheet.value) return

  const payload = {
    scores: ratingAnswers(sheet).map((ans) => ({
      answer_id: ans.id,
      hr_score: Number(draftScores[ans.id])
    }))
  }

  await evaluationsStore.submitReviewScore(props.cycleId, sheet.id, payload)
  closeGradingDrawer()
}

// ================= اعتماد النتيجة النهائية (الحساب فعلياً بالباك اند) =================
async function calculateFinalResult() {
  const result = await evaluationsStore.finalizeScore(props.cycleId, selectedEmployeeId.value)
  finalResultForSelected.value = result
  await evaluationsStore.fetchFinalResults(props.cycleId)
}

// تصنيف احتياطي فقط في حال لم يرسل الباك اند تصنيفاً جاهزاً مع الدرجة
function classify(score) {
  const n = Number(score)
  if (!Number.isFinite(n)) return null
  if (n >= 8.5) return 'Excellent'
  if (n >= 5.0) return 'Good'
  return 'Poor'
}
function classificationOf(result) {
  if (!result) return null
  if (result.rating) return result.rating
  return classify(result.final_score ?? result.score)
}

const finalResultsList = computed(() =>
  Array.isArray(evaluationsStore.finalResults) ? evaluationsStore.finalResults : []
)

const existingFinalResult = computed(() =>
  finalResultsList.value.find((r) => (r.employee_id ?? r.employee?.id) === selectedEmployeeId.value) ?? null
)
const displayedFinalResult = computed(() => finalResultForSelected.value ?? existingFinalResult.value ?? null)
const isAlreadyFinalized = computed(() =>
  String(displayedFinalResult.value?.status || '').toLowerCase() === 'finalized'
)

const badgeColorClass = computed(() => {
  const rating = classificationOf(displayedFinalResult.value)
  if (rating === 'Excellent') return 'bg-emerald-500'
  if (rating === 'Good') return 'bg-blue-500'
  return 'bg-rose-500'
})

// ================= إحصائيات وتوزيع الـ Donut =================
const totalRated = computed(() => finalResultsList.value.length)
const totalEmployees = computed(() =>
  Array.isArray(evaluationsStore.scorableEmployees) ? evaluationsStore.scorableEmployees.length : 0
)
const excellentCount = computed(() => finalResultsList.value.filter((r) => classificationOf(r) === 'Excellent').length)
const goodCount = computed(() => finalResultsList.value.filter((r) => classificationOf(r) === 'Good').length)
const poorCount = computed(() => finalResultsList.value.filter((r) => classificationOf(r) === 'Poor').length)

const pctExcellent = computed(() => (totalRated.value ? (excellentCount.value / totalRated.value) * 100 : 0))
const pctGood = computed(() => (totalRated.value ? (goodCount.value / totalRated.value) * 100 : 0))
const pctPoor = computed(() => (totalRated.value ? (poorCount.value / totalRated.value) * 100 : 0))

function isCalculated(emp) {
  return !!finalResultsList.value.find((r) => (r.employee_id ?? r.employee?.id) === empId(emp))
}
</script>

<template>
  <div class="space-y-6">
    <BaseAlert v-if="evaluationsStore.error" variant="error">{{ evaluationsStore.error }}</BaseAlert>

    <!-- Stats & donut -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h4 class="text-sm font-black text-khubrat-blue dark:text-khubrat-goldLight uppercase tracking-wider">{{ $t('evaluations.metricsSummary') }}</h4>
        <p class="text-xs text-slate-400 leading-relaxed">
          {{ $t('evaluations.metricsHint') }}
        </p>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600">
            <span class="text-lg font-black block">{{ excellentCount }}</span>
            <span class="text-[9px] font-bold block uppercase">{{ $t('evaluations.excellent') }}</span>
          </div>
          <div class="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
            <span class="text-lg font-black block">{{ goodCount }}</span>
            <span class="text-[9px] font-bold block uppercase">{{ $t('evaluations.good') }}</span>
          </div>
          <div class="p-2.5 bg-rose-500/10 rounded-xl text-rose-500">
            <span class="text-lg font-black block">{{ poorCount }}</span>
            <span class="text-[9px] font-bold block uppercase">{{ $t('evaluations.poor') }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-around gap-6 lg:col-span-2">
        <div class="space-y-1">
          <h5 class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">{{ $t('evaluations.performanceDistribution') }}</h5>
          <p class="text-[10px] text-slate-400">{{ $t('evaluations.performanceHint') }}</p>
          <div class="space-y-1.5 pt-2 text-[10px] font-bold">
            <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> <span>{{ $t('evaluations.excellentRange') }}</span></div>
            <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 bg-blue-500 rounded-full"></span> <span>{{ $t('evaluations.goodRange') }}</span></div>
            <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 bg-rose-500 rounded-full"></span> <span>{{ $t('evaluations.poorRange') }}</span></div>
          </div>
        </div>

        <div class="relative w-28 h-28 flex items-center justify-center">
          <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" stroke-width="3" class="dark:stroke-slate-700" />
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" stroke-width="3.5" :stroke-dasharray="`${pctExcellent} 100`" stroke-dashoffset="0" class="transition-all duration-500" />
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" stroke-width="3.5" :stroke-dasharray="`${pctGood} 100`" :stroke-dashoffset="`-${pctExcellent}`" class="transition-all duration-500" />
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f43f5e" stroke-width="3.5" :stroke-dasharray="`${pctPoor} 100`" :stroke-dashoffset="`-${pctExcellent + pctGood}`" class="transition-all duration-500" />
          </svg>
          <div class="absolute text-center">
            <span class="text-xs font-black block text-slate-800 dark:text-white">{{ totalRated }}/{{ totalEmployees }}</span>
            <span class="text-[8px] text-slate-400 font-semibold block uppercase">{{ $t('evaluations.rated') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Grading workspace -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <!-- Left: queue -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div class="border-b border-slate-100 dark:border-slate-700 pb-3 space-y-2">
          <h4 class="text-sm font-black text-khubrat-blue dark:text-white">{{ $t('evaluations.activeQueue') }}</h4>
          <p class="text-[10px] text-slate-400">{{ $t('evaluations.queueHint') }}</p>
        </div>

        <div class="space-y-3">
          <BaseInput v-model="searchName" :placeholder="$t('evaluations.searchEmployee')" />
          <BaseSelect v-model="filterDept" :options="departmentOptions" />
        </div>

        <LoadingSpinner v-if="evaluationsStore.scoringLoading && !selectedEmployeeId" />
        <div v-else class="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          <p v-if="!filteredEmployees.length" class="text-center text-[11px] text-slate-400 py-6">{{ $t('evaluations.noCandidates') }}</p>
          <div
            v-for="emp in filteredEmployees"
            :key="empId(emp)"
            class="p-3 rounded-xl border cursor-pointer flex items-center justify-between gap-3 transition-all"
            :class="
              selectedEmployeeId === empId(emp)
                ? 'border-khubrat-blue dark:border-khubrat-goldLight bg-khubrat-blue/5 dark:bg-khubrat-goldLight/10'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            "
            @click="selectEmployee(empId(emp))"
          >
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-khubrat-blue/10 dark:bg-khubrat-goldLight/10 text-khubrat-blue dark:text-khubrat-goldLight flex items-center justify-center font-bold text-xs">
                {{ initials(empName(emp)) }}
              </div>
              <div>
                <h5 class="font-extrabold text-xs text-slate-900 dark:text-white">{{ empName(emp) || $t('common.emDash') }}</h5>
                <p class="text-[9px] text-slate-400">{{ empSubtitle(emp) }}</p>
              </div>
            </div>
            <span v-if="isCalculated(emp)" class="text-[9px] bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded font-extrabold uppercase">
              {{ $t('evaluations.calculated') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Right: details -->
      <div v-if="selectedEmployee" class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full border border-khubrat-goldLight bg-khubrat-blue/10 dark:bg-khubrat-goldLight/10 text-khubrat-blue dark:text-khubrat-goldLight flex items-center justify-center font-bold">
              {{ initials(empName(selectedEmployee)) }}
            </div>
            <div>
              <h4 class="text-sm font-black text-slate-900 dark:text-white">{{ empName(selectedEmployee) || $t('common.emDash') }}</h4>
              <p class="text-[10px] text-slate-400">{{ empSubtitle(selectedEmployee) }}</p>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">{{ $t('evaluations.sheetsTitle') }}</h5>
            <span class="text-[10px] text-khubrat-goldDark dark:text-khubrat-goldLight font-bold">{{ $t('evaluations.gradesScale') }}</span>
          </div>

          <LoadingSpinner v-if="evaluationsStore.scoringLoading" :label="$t('evaluations.loadingSheets')" />

          <p v-else-if="!sheets.length" class="text-xs text-slate-400 p-4">
            {{ $t('evaluations.noSheets') }}
          </p>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="sheet in sheets"
              :key="sheet.id"
              class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
            >
              <div class="flex justify-between items-start gap-2">
                <div>
                  <span class="text-[9px] text-slate-400 block uppercase font-bold">{{ $t('evaluations.feedbackSource') }}</span>
                  <h5 class="font-extrabold text-xs text-slate-800 dark:text-slate-200">{{ sheetLabel(sheet) }}</h5>
                  <p class="text-[9px] text-slate-400 mt-0.5">{{ sheet.reviewer?.full_name }}</p>
                </div>
                <span
                  class="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0"
                  :class="isSheetGraded(sheet) ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                >
                  {{ isSheetGraded(sheet) ? $t('evaluations.doneOf', { n: sheetAverage(sheet) }) : $t('evaluations.pendingGrading') }}
                </span>
              </div>
              <div class="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                <span class="text-[10px] text-slate-400 font-bold">
                  {{ $t('evaluations.scorableResponses', { scorable: ratingAnswers(sheet).length, total: (sheet.answers || []).length }) }}
                </span>
                <button
                  class="text-[10px] font-black text-khubrat-blue dark:text-khubrat-goldLight hover:underline flex items-center gap-1"
                  @click="openGradingDrawer(sheet)"
                >
                  {{ isSheetGraded(sheet) ? $t('evaluations.editSheet') : $t('evaluations.gradeSheet') }}
                  <i class="fa-solid fa-chevron-right text-[8px]"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="space-y-0.5 text-start">
            <h6 class="text-xs font-bold text-slate-800 dark:text-slate-200">{{ $t('evaluations.finalReport') }}</h6>
            <p class="text-[10px] text-slate-400 leading-relaxed max-w-md">{{ $t('evaluations.weightedHint') }}</p>
          </div>
          <BaseButton
            variant="blue"
            :disabled="!allSheetsGraded || isAlreadyFinalized"
            :loading="evaluationsStore.ActionLoading"
            @click="calculateFinalResult"
          >
            {{ isAlreadyFinalized ? $t('evaluations.scoreFinalized') : $t('evaluations.calculateFinal') }}
          </BaseButton>
        </div>

        <div v-if="displayedFinalResult && (displayedFinalResult.final_score !== null && displayedFinalResult.final_score !== undefined)" class="p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 space-y-4 shadow-md">
          <div class="flex justify-between items-center gap-4">
            <div class="flex items-center gap-4">
              <div class="p-3 bg-emerald-500 text-white rounded-xl text-xl">
                <i class="fa-solid fa-award"></i>
              </div>
              <div class="space-y-0.5">
                <span class="text-[10px] font-black uppercase tracking-widest block text-slate-400">{{ $t('evaluations.weightedRating') }}</span>
                <h4 class="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  {{ $t('evaluations.grade') }}
                  <span class="text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {{ formatScore(displayedFinalResult.final_score) }}/10
                  </span>
                </h4>
              </div>
            </div>
            <span class="px-4 py-2 text-white font-black text-xs rounded-xl uppercase tracking-widest" :class="badgeColorClass">
              {{ displayRating(classificationOf(displayedFinalResult)) }}
            </span>
          </div>

          <div class="grid grid-cols-3 gap-3 pt-2 border-t border-emerald-500/20">
            <div class="text-center">
              <p class="text-[9px] font-bold uppercase text-slate-400">{{ $t('evaluations.manager') }}</p>
              <p class="text-sm font-black text-slate-800 dark:text-white">{{ formatScore(displayedFinalResult.manager_score) }}</p>
            </div>
            <div class="text-center">
              <p class="text-[9px] font-bold uppercase text-slate-400">{{ $t('evaluations.self') }}</p>
              <p class="text-sm font-black text-slate-800 dark:text-white">{{ formatScore(displayedFinalResult.self_score) }}</p>
            </div>
            <div class="text-center">
              <p class="text-[9px] font-bold uppercase text-slate-400">{{ $t('evaluations.peer') }}</p>
              <p class="text-sm font-black text-slate-800 dark:text-white">{{ formatScore(displayedFinalResult.peer_score) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-12 border border-slate-200 dark:border-slate-700 text-center shadow-sm text-slate-400">
        <i class="fa-solid fa-star-half-stroke text-5xl mb-3 block text-khubrat-goldDark/30"></i>
        <p class="font-bold text-sm">{{ $t('evaluations.noActive') }}</p>
        <p class="text-xs text-slate-400 mt-1">{{ $t('evaluations.noActiveHint') }}</p>
      </div>
    </div>

    <!-- Sheet grading drawer -->
    <div v-if="gradingSheet" class="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-black/55 backdrop-blur-sm" @click="closeGradingDrawer"></div>
      <div class="pointer-events-none fixed inset-y-0 end-0 flex max-w-full ps-10">
        <div class="pointer-events-auto w-screen max-w-xl bg-white dark:bg-slate-800 shadow-2xl flex flex-col">
          <div class="bg-khubrat-blue text-white p-6 border-b border-khubrat-goldLight/20">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-md font-extrabold text-khubrat-goldLight uppercase tracking-wider">
                  {{ $t('evaluations.gradeSheetLabel', { label: sheetLabel(gradingSheet) }) }}
                </h2>
                <p class="text-[10px] text-white/60 mt-0.5">
                  {{ $t('evaluations.reviewAnswersFor', { name: selectedEmployee ? empName(selectedEmployee) : '' }) }}
                </p>
              </div>
              <button class="text-white/60 hover:text-white transition-all" @click="closeGradingDrawer">
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            <div
              v-for="(answer, idx) in gradingAnswers"
              :key="answer.id"
              class="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 space-y-3"
            >
              <div class="space-y-1">
                <span class="text-[9px] text-khubrat-goldDark dark:text-khubrat-goldLight font-black uppercase block">
                  {{ $t('evaluations.criteriaN', { n: idx + 1 }) }}
                </span>
                <h5 class="font-bold text-xs text-slate-800 dark:text-slate-100">
                  {{ answer.question?.question }}
                </h5>
              </div>

              <div class="p-3 bg-white dark:bg-slate-950 rounded-lg italic text-slate-500 dark:text-slate-300 border-l-4 border-khubrat-blue dark:border-khubrat-goldLight">
                <template v-if="answer.comment">"{{ answer.comment }}"</template>
                <template v-else-if="answer.rating !== null && answer.rating !== undefined">
                  {{ $t('evaluations.ratingGiven') }} <strong class="text-slate-800 dark:text-slate-100">{{ answer.rating }} / 5</strong>
                </template>
                <template v-else>{{ $t('evaluations.noWritten') }}</template>
              </div>

              <!-- درجة الـ HR تُرسل لأسئلة النوع rating فقط -->
              <div class="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800">
                <span class="text-[10px] text-slate-400 font-bold uppercase">{{ $t('evaluations.assignScore') }}</span>
                <div class="flex items-center gap-2">
                  <input
                    v-model="draftScores[answer.id]"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    class="w-16 px-2 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-center text-xs rounded-lg text-khubrat-blue dark:text-khubrat-goldLight focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight"
                  />
                  <span class="text-slate-400 font-bold">/ 10</span>
                </div>
              </div>
              
            </div>
          </div>

          <div class="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
            <BaseButton variant="ghost" full-width @click="closeGradingDrawer">{{ $t('common.cancel') }}</BaseButton>
            <BaseButton
              variant="blue"
              full-width
              :disabled="!canSubmitSheet"
              :loading="evaluationsStore.ActionLoading"
              @click="submitGradedSheet"
            >
              {{ $t('evaluations.saveScores') }}
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
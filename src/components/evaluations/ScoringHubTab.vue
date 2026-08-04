<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
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

function empId(emp) { return emp.employee_id ?? emp.id }
function empName(emp) { return emp.name || emp.employee_name || '' }
function empDept(emp) { return emp.department ?? emp.dept ?? '' }
function initials(name = '') {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

const departmentOptions = computed(() => {
  const depts = [...new Set(evaluationsStore.scorableEmployees.map(empDept).filter(Boolean))]
  return [{ value: 'all', label: 'All Departments' }, ...depts.map((d) => ({ value: d, label: d }))]
})

const filteredEmployees = computed(() =>
  evaluationsStore.scorableEmployees.filter((emp) => {
    const matchesSearch = empName(emp).toLowerCase().includes(searchName.value.toLowerCase())
    const matchesDept = filterDept.value === 'all' || empDept(emp) === filterDept.value
    return matchesSearch && matchesDept
  })
)

// اختيار موظف من القائمة وجلب تفاصيل تصحيحه
async function selectEmployee(id) {
  selectedEmployeeId.value = id
  finalResultForSelected.value = null
  await evaluationsStore.fetchScoringDetails(props.cycleId, { employee_id: id })
}

const selectedEmployee = computed(() =>
  evaluationsStore.scorableEmployees.find((e) => empId(e) === selectedEmployeeId.value) || null
)
const sheets = computed(() => evaluationsStore.scoringDetails?.sheets ?? [])
const allSheetsGraded = computed(() => sheets.value.length > 0 && sheets.value.every((s) => s.graded))

function sheetAverage(sheet) {
  const scored = (sheet.questions || []).filter((q) => q.score !== null && q.score !== undefined)
  if (!scored.length) return 0
  return (scored.reduce((sum, q) => sum + Number(q.score), 0) / scored.length).toFixed(1)
}

// ================= درج تصحيح الورقة =================
const gradingSheet = ref(null)
const draftScores = reactive({})

function openGradingDrawer(sheet) {
  gradingSheet.value = sheet
  Object.keys(draftScores).forEach((k) => delete draftScores[k])
  ;(sheet.questions || []).forEach((q) => {
    draftScores[q.question_id ?? q.id] = q.score ?? null
  })
}
function closeGradingDrawer() {
  gradingSheet.value = null
}

async function submitGradedSheet() {
  const sheet = gradingSheet.value
  if (!sheet) return
  const anyMissing = Object.values(draftScores).some((v) => v === null || v === '')
  if (anyMissing) return

  const payload = {
    scores: (sheet.questions || []).map((q) => ({
      question_id: q.question_id ?? q.id,
      score: Number(draftScores[q.question_id ?? q.id])
    }))
  }
  await evaluationsStore.submitReviewScore(props.cycleId, sheet.review_id ?? sheet.id, payload)

  sheet.graded = true
  sheet.questions.forEach((q) => {
    q.score = draftScores[q.question_id ?? q.id]
  })
  closeGradingDrawer()
}

// ================= حساب النتيجة النهائية (الحساب فعلياً بالباك اند) =================
async function calculateFinalResult() {
  const result = await evaluationsStore.finalizeScore(props.cycleId, selectedEmployeeId.value)
  finalResultForSelected.value = result?.data ?? result
  await evaluationsStore.fetchFinalResults(props.cycleId)
}

// تصنيف احتياطي فقط في حال لم يرسل الباك اند تصنيفاً جاهزاً مع الدرجة
function classify(score) {
  if (score >= 8.5) return 'Excellent'
  if (score >= 5.0) return 'Good'
  return 'Poor'
}
function classificationOf(result) {
  if (!result) return null
  return result.rating ?? classify(Number(result.final_score ?? result.score ?? 0))
}

const existingFinalResult = computed(() =>
  evaluationsStore.finalResults.find((r) => (r.employee_id ?? r.id) === selectedEmployeeId.value)
)
const displayedFinalResult = computed(() => finalResultForSelected.value ?? existingFinalResult.value ?? null)

const badgeColorClass = computed(() => {
  const rating = classificationOf(displayedFinalResult.value)
  if (rating === 'Excellent') return 'bg-emerald-500'
  if (rating === 'Good') return 'bg-blue-500'
  return 'bg-rose-500'
})

// ================= إحصائيات وتوزيع الـ Donut =================
const totalRated = computed(() => evaluationsStore.finalResults.length)
const totalEmployees = computed(() => evaluationsStore.scorableEmployees.length)
const excellentCount = computed(() => evaluationsStore.finalResults.filter((r) => classificationOf(r) === 'Excellent').length)
const goodCount = computed(() => evaluationsStore.finalResults.filter((r) => classificationOf(r) === 'Good').length)
const poorCount = computed(() => evaluationsStore.finalResults.filter((r) => classificationOf(r) === 'Poor').length)

const pctExcellent = computed(() => (totalRated.value ? (excellentCount.value / totalRated.value) * 100 : 0))
const pctGood = computed(() => (totalRated.value ? (goodCount.value / totalRated.value) * 100 : 0))
const pctPoor = computed(() => (totalRated.value ? (poorCount.value / totalRated.value) * 100 : 0))

function isCalculated(emp) {
  return !!classificationOf(evaluationsStore.finalResults.find((r) => (r.employee_id ?? r.id) === empId(emp)))
}
</script>

<template>
  <div class="space-y-6">
    <BaseAlert v-if="evaluationsStore.error" variant="error">{{ evaluationsStore.error }}</BaseAlert>

    <!-- Stats & donut -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h4 class="text-sm font-black text-khubrat-blue dark:text-khubrat-goldLight uppercase tracking-wider">Evaluation Metrics Summary</h4>
        <p class="text-xs text-slate-400 leading-relaxed">
          Monitor the qualitative distributions of all evaluated employees. Ratings are computed by the server as HR grades sheets.
        </p>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600">
            <span class="text-lg font-black block">{{ excellentCount }}</span>
            <span class="text-[9px] font-bold block uppercase">Excellent</span>
          </div>
          <div class="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
            <span class="text-lg font-black block">{{ goodCount }}</span>
            <span class="text-[9px] font-bold block uppercase">Good</span>
          </div>
          <div class="p-2.5 bg-rose-500/10 rounded-xl text-rose-500">
            <span class="text-lg font-black block">{{ poorCount }}</span>
            <span class="text-[9px] font-bold block uppercase">Poor</span>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-around gap-6 lg:col-span-2">
        <div class="space-y-1">
          <h5 class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Performance Distribution</h5>
          <p class="text-[10px] text-slate-400">Visual segment of completed employee scores this period</p>
          <div class="space-y-1.5 pt-2 text-[10px] font-bold">
            <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> <span>Excellent (Score >= 8.5)</span></div>
            <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 bg-blue-500 rounded-full"></span> <span>Good (Score 5.0 - 8.4)</span></div>
            <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 bg-rose-500 rounded-full"></span> <span>Poor (Score &lt; 5.0)</span></div>
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
            <span class="text-[8px] text-slate-400 font-semibold block uppercase">Rated</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Grading workspace -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <!-- Left: queue -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div class="border-b border-slate-100 dark:border-slate-700 pb-3 space-y-2">
          <h4 class="text-sm font-black text-khubrat-blue dark:text-white">Active Evaluations Queue</h4>
          <p class="text-[10px] text-slate-400">Select an employee with fully submitted reviews to score and calculate their final index.</p>
        </div>

        <div class="space-y-3">
          <BaseInput v-model="searchName" placeholder="Search employee name…" />
          <BaseSelect v-model="filterDept" :options="departmentOptions" />
        </div>

        <LoadingSpinner v-if="evaluationsStore.loading" />
        <div v-else class="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          <p v-if="!filteredEmployees.length" class="text-center text-[11px] text-slate-400 py-6">No matching candidates in grading queue.</p>
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
                <h5 class="font-extrabold text-xs text-slate-900 dark:text-white">{{ empName(emp) }}</h5>
                <p class="text-[9px] text-slate-400">{{ empDept(emp) }}</p>
              </div>
            </div>
            <span v-if="isCalculated(emp)" class="text-[9px] bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded font-extrabold uppercase">
              Calculated
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
              <h4 class="text-sm font-black text-slate-900 dark:text-white">{{ empName(selectedEmployee) }}</h4>
              <p class="text-[10px] text-slate-400">{{ empDept(selectedEmployee) }}</p>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Evaluation Sheets Submitted by Peers & Managers</h5>
            <span class="text-[10px] text-khubrat-goldDark dark:text-khubrat-goldLight font-bold">Grades on a 10-point scale</span>
          </div>

          <p v-if="!sheets.length" class="text-xs text-slate-400 p-4">No grading sheets available for this candidate.</p>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="sheet in sheets"
              :key="sheet.review_id ?? sheet.id"
              class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
            >
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-[9px] text-slate-400 block uppercase font-bold">Feedback Source</span>
                  <h5 class="font-extrabold text-xs text-slate-800 dark:text-slate-200">{{ sheet.source }}</h5>
                </div>
                <span class="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider" :class="sheet.graded ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'">
                  {{ sheet.graded ? `Done (${sheetAverage(sheet)}/10)` : 'Pending Grading' }}
                </span>
              </div>
              <div class="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                <span class="text-[10px] text-slate-400 font-bold">{{ (sheet.questions || []).length }} criteria responses</span>
                <button class="text-[10px] font-black text-khubrat-blue dark:text-khubrat-goldLight hover:underline flex items-center gap-1" @click="openGradingDrawer(sheet)">
                  {{ sheet.graded ? 'Edit Sheet Score' : 'Grade Sheet' }} <i class="fa-solid fa-chevron-right text-[8px]"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="space-y-0.5 text-left">
            <h6 class="text-xs font-bold text-slate-800 dark:text-slate-200">Final Index Appraisal Report</h6>
            <p class="text-[10px] text-slate-400 leading-relaxed max-w-md">Weighted index is calculated automatically by the server once all sheets are graded.</p>
          </div>
          <BaseButton variant="blue" :disabled="!allSheetsGraded" :loading="evaluationsStore.ActionLoading" @click="calculateFinalResult">
            Calculate Final Result
          </BaseButton>
        </div>

        <div v-if="displayedFinalResult" class="p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 flex justify-between items-center shadow-md">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-emerald-500 text-white rounded-xl text-xl">
              <i class="fa-solid fa-award"></i>
            </div>
            <div class="space-y-0.5">
              <span class="text-[10px] font-black uppercase tracking-widest block text-slate-400">Weighted Performance Rating</span>
              <h4 class="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                Grade: <span class="text-emerald-600 dark:text-emerald-400 font-extrabold">{{ displayedFinalResult.final_score ?? displayedFinalResult.score }}/10</span>
              </h4>
            </div>
          </div>
          <span class="px-4 py-2 text-white font-black text-xs rounded-xl uppercase tracking-widest" :class="badgeColorClass">
            {{ classificationOf(displayedFinalResult) }}
          </span>
        </div>
      </div>

      <div v-else class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-12 border border-slate-200 dark:border-slate-700 text-center shadow-sm text-slate-400">
        <i class="fa-solid fa-star-half-stroke text-5xl mb-3 block text-khubrat-goldDark/30"></i>
        <p class="font-bold text-sm">No Active Evaluation Selected</p>
        <p class="text-xs text-slate-400 mt-1">Select an employee from the left column to begin grading sheets and generate their weighted performance report.</p>
      </div>
    </div>

    <!-- Sheet grading drawer -->
    <div v-if="gradingSheet" class="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-black/55 backdrop-blur-xs" @click="closeGradingDrawer"></div>
      <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div class="pointer-events-auto w-screen max-w-xl bg-white dark:bg-slate-800 shadow-2xl flex flex-col">
          <div class="bg-khubrat-blue text-white p-6 border-b border-khubrat-goldLight/20">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-md font-extrabold text-khubrat-goldLight uppercase tracking-wider">Grade Sheet: {{ gradingSheet.source }}</h2>
                <p class="text-[10px] text-white/60 mt-0.5">Review answers for {{ selectedEmployee ? empName(selectedEmployee) : '' }}</p>
              </div>
              <button class="text-white/60 hover:text-white transition-all" @click="closeGradingDrawer">
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            <div
              v-for="(question, idx) in gradingSheet.questions"
              :key="question.question_id ?? question.id"
              class="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 space-y-3"
            >
              <div class="space-y-1">
                <span class="text-[9px] text-khubrat-goldDark dark:text-khubrat-goldLight font-black uppercase block">Evaluation Criteria {{ idx + 1 }}</span>
                <h5 class="font-bold text-xs text-slate-800 dark:text-slate-100">{{ question.text ?? question.question }}</h5>
              </div>
              <div class="p-3 bg-white dark:bg-slate-850 rounded-lg italic text-slate-500 dark:text-slate-300 border-l-4 border-khubrat-blue dark:border-khubrat-goldLight">
                "{{ question.answer }}"
              </div>
              <div class="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800">
                <span class="text-[10px] text-slate-400 font-bold uppercase">Assign Score Value (0 - 10)</span>
                <div class="flex items-center gap-2">
                  <input
                    v-model="draftScores[question.question_id ?? question.id]"
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
            <BaseButton variant="ghost" full-width @click="closeGradingDrawer">Cancel</BaseButton>
            <BaseButton variant="blue" full-width :loading="evaluationsStore.ActionLoading" @click="submitGradedSheet">Mark Sheet as Done</BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
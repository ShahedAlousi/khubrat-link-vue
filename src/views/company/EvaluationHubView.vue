<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEvaluationsStore } from '@/stores/useEvaluationsStore'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import FormBuilderTab from '@/components/evaluations/FormBuilderTab.vue'
import ProgressMonitorTab from '@/components/evaluations/ProgressMonitorTab.vue'
import ScoringHubTab from '@/components/evaluations/ScoringHubTab.vue'

const evaluationsStore = useEvaluationsStore()
const { t } = useI18n()

const tabs = computed(() => [
  { id: 'form-builder', label: t('evaluations.formBuilder'), icon: 'fa-cubes' },
  { id: 'progress-monitor', label: t('evaluations.progressMonitor'), icon: 'fa-chart-line' },
  { id: 'scoring-canvas', label: t('evaluations.scoringHub'), icon: 'fa-feather-pointed' }
])
const activeTab = ref('form-builder')

function selectTab(tabId) {
  activeTab.value = tabId
}

const selectedCycleId = ref('')

const cycleOptions = computed(() =>
  evaluationsStore.cycles.map((c) => ({ value: c.id, label: c.name }))
)
const currentCycle = computed(() =>
  evaluationsStore.cycles.find((c) => c.id === selectedCycleId.value) || null
)
const cycleStatus = computed(() => currentCycle.value?.status || 'draft')

const statusBadge = computed(() => {
  if (cycleStatus.value === 'active') {
    return { text: t('evaluations.activePeriod'), dot: 'bg-emerald-400', wrap: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30' }
  }
  if (cycleStatus.value === 'closed') {
    return { text: t('evaluations.closed'), dot: 'bg-slate-400', wrap: 'bg-slate-500/20 text-slate-300 border-slate-400/30' }
  }
  return { text: t('evaluations.draft'), dot: 'bg-amber-400', wrap: 'bg-amber-500/20 text-khubrat-goldLight border-khubrat-goldLight/30' }
})

// مزامنة الدورة المختارة مع الستور حتى تقدر باقي التبويبات تستخدمها
// watch(selectedCycleId, (id) => {
//   evaluationsStore.currentCycle = evaluationsStore.cycles.find((c) => c.id === id) || null
// })
// مزامنة الدورة المختارة مع الستور
watch(selectedCycleId, (id) => {
  if (id) {
    evaluationsStore.currentCycle = evaluationsStore.cycles.find((c) => c.id === id) || null
  }
})

// جلب الدورات عند فتح الصفحة وتحديد أول دورة كافتراضية
async function loadCycles() {
  await evaluationsStore.fetchCycles()
  if (!selectedCycleId.value && evaluationsStore.cycles.length) {
    selectedCycleId.value = evaluationsStore.cycles[0].id
  }
}
onMounted(loadCycles)

// إطلاق دورة التقييم الحالية
async function handleLaunch() {
  if (!currentCycle.value || cycleStatus.value !== 'draft') return
  await evaluationsStore.launchCycle(currentCycle.value.id)
  await loadCycles()
  activeTab.value = 'progress-monitor'
}

// نموذج إنشاء دورة تقييم جديدة (الواجهة الأصلية افترضت وجود الفترات مسبقاً، وهذا النموذج مطلوب فعلياً لأن الباك اند يحتاج إنشاء صريح)
const showCreateCycleModal = ref(false)
const newCycleForm = ref({ name: '', evaluation_template_id: '', start_date: '', end_date: '' })
const templateOptions = computed(() => evaluationsStore.templates.map((t) => ({ value: t.id, label: t.name })))

async function openCreateCycleModal() {
  await evaluationsStore.fetchTemplates()
  newCycleForm.value = { name: '', evaluation_template_id: '', start_date: '', end_date: '' }
  showCreateCycleModal.value = true
}
async function handleCreateCycle() {
  const created = await evaluationsStore.createCycle(newCycleForm.value)
  await loadCycles()
  if (created?.id) selectedCycleId.value = created.id
  showCreateCycleModal.value = false
}

async function handleCloseCycle() {
  if (!currentCycle.value) return
  await evaluationsStore.closeCycle(currentCycle.value.id)
  activeTab.value = 'scoring-canvas' // التوجيه التلقائي
}
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Cycle header card -->
    <div class="bg-gradient-to-r from-khubrat-blue to-blue-950 text-white p-6 rounded-2xl shadow-md border-b-4 border-khubrat-goldLight flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div class="space-y-1">
        <div class="flex items-center gap-3 flex-wrap">
          <h3 class="text-lg font-bold text-khubrat-goldLight">{{ $t('evaluations.title') }}</h3>
          <span class="px-3 py-1 text-[10px] font-extrabold rounded-full border flex items-center gap-1.5 uppercase" :class="statusBadge.wrap">
            <span class="w-1.5 h-1.5 rounded-full animate-pulse" :class="statusBadge.dot"></span>
            {{ statusBadge.text }}
          </span>
        </div>
        <p class="text-xs text-slate-200 leading-relaxed max-w-2xl">
          {{ $t('evaluations.subtitle') }}
        </p>
      </div>

      <div class="flex items-center gap-3 self-end md:self-auto flex-wrap">
        <div class="min-w-[190px]">
          <BaseSelect v-model="selectedCycleId" :options="cycleOptions" :placeholder="$t('evaluations.selectPeriod')" />
        </div>

        <BaseButton variant="ghost" @click="openCreateCycleModal">
          <i class="fa-solid fa-plus"></i> {{ $t('evaluations.newPeriod') }}
        </BaseButton>

        <BaseButton
          v-if="cycleStatus === 'draft'"
          variant="gold"
          :loading="evaluationsStore.ActionLoading"
          :disabled="!currentCycle"
          @click="handleLaunch"
        >
          <i class="fa-solid fa-rocket"></i> {{ $t('evaluations.launch') }}
        </BaseButton>
        <BaseButton
          v-else-if="cycleStatus === 'active'"
          variant="danger"
          :loading="evaluationsStore.ActionLoading"
          @click="handleCloseCycle"
        >
          <i class="fa-solid fa-lock"></i> {{ $t('evaluations.closePeriod') }}
        </BaseButton>
        <BaseButton v-else variant="ghost" disabled>
          <i class="fa-solid fa-circle-check"></i> {{ $t('evaluations.closedDeployed') }}
        </BaseButton>
      </div>
    </div>

    <BaseAlert v-if="evaluationsStore.error" variant="error">{{ evaluationsStore.error }}</BaseAlert>

    <LoadingSpinner v-if="evaluationsStore.cyclesLoading" />

    <div
      v-if="!evaluationsStore.cyclesLoading && !evaluationsStore.cycles.length"
      class="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl px-4 py-3 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-3"
    >
      <i class="fa-solid fa-circle-info mt-0.5"></i>
      <div>
        <p class="font-bold">{{ $t('evaluations.noPeriods') }}</p>
        <p class="mt-0.5 opacity-90">{{ $t('evaluations.noPeriodsHint') }}</p>
      </div>
    </div>

    <!-- All three hub tabs are always available; form-builder is the default. -->
    <div class="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
        :class="
          activeTab === tab.id
            ? 'bg-khubrat-blue text-khubrat-goldLight dark:bg-khubrat-goldLight dark:text-khubrat-blue shadow-sm'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
        "
        @click="selectTab(tab.id)"
      >
        <i class="fa-solid" :class="tab.icon"></i> {{ tab.label }}
      </button>
    </div>

    <div>
      <FormBuilderTab v-show="activeTab === 'form-builder'" :cycle-id="currentCycle?.id" />
      <ProgressMonitorTab v-show="activeTab === 'progress-monitor'" :cycle-id="currentCycle?.id" />
      <ScoringHubTab v-show="activeTab === 'scoring-canvas'" :cycle-id="currentCycle?.id" />
    </div>

    <!-- Create cycle modal -->
    <ConfirmModal
      v-if="showCreateCycleModal"
      :title="$t('evaluations.createPeriodTitle')"
      :confirm-label="$t('evaluations.createPeriod')"
      :loading="evaluationsStore.ActionLoading"
      @cancel="showCreateCycleModal = false"
      @confirm="handleCreateCycle"
    >
      <BaseInput v-model="newCycleForm.name" :label="$t('evaluations.periodName')" :placeholder="$t('evaluations.periodPlaceholder')" required />
      <BaseSelect v-model="newCycleForm.evaluation_template_id" :label="$t('evaluations.evaluationTemplate')" :options="templateOptions" required />
      <div class="grid grid-cols-2 gap-3">
        <BaseInput v-model="newCycleForm.start_date" type="date" :label="$t('evaluations.startDate')" required />
        <BaseInput v-model="newCycleForm.end_date" type="date" :label="$t('evaluations.endDate')" required />
      </div>
    </ConfirmModal>
  </div>
</template>
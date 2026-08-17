<script setup>
import { onMounted, reactive, ref } from 'vue'
import PolicyReadonlyValue from './PolicyReadonlyValue.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useEvaluationPolicyStore } from '@/stores/evaluationPolicy.store'

const props = defineProps({
  readonly: { type: Boolean, default: false }
})

const authStore = useAuthStore()
const evaluationPolicyStore = useEvaluationPolicyStore()

const form = reactive({ ...evaluationPolicyStore.policy })

const saveError = ref('')
const saveSuccess = ref(false)

function syncFormFromStore() {
  Object.assign(form, evaluationPolicyStore.policy)
}

onMounted(async () => {
  if (!authStore.companyId) return
  try {
    await evaluationPolicyStore.fetchPolicy(authStore.companyId)
  } catch {
    // Keep defaults if the policy has not been created yet / GET fails.
  }
  syncFormFromStore()
})

async function handleSave() {
  saveError.value = ''
  saveSuccess.value = false
  try {
    await evaluationPolicyStore.savePolicy(authStore.companyId, { ...form })
    syncFormFromStore()
    saveSuccess.value = true
  } catch (err) {
    saveError.value = err.message || evaluationPolicyStore.error
  }
}
</script>

<template>
  <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
      <div class="space-y-1">
        <h4 class="text-md font-bold text-khubrat-blue dark:text-khubrat-goldLight">Performance Appraisal Integration</h4>
        <p class="text-xs text-slate-400">
          Establish direct structural linkages between manager reviews and base payroll parameters.
        </p>
      </div>
      <div class="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <span class="text-xs font-bold">Link Appraisals to Payroll?</span>
        <span v-if="readonly" class="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {{ form.apply_review_to_salary ? 'Yes' : 'No' }}
        </span>
        <ToggleSwitch v-else v-model="form.apply_review_to_salary" />
      </div>
    </div>

    <BaseAlert v-if="saveSuccess" variant="success">Evaluation policy saved successfully.</BaseAlert>
    <BaseAlert v-if="saveError" variant="error">{{ saveError }}</BaseAlert>

    <PolicyReadonlyValue
      v-if="readonly"
      label="Peer Reviews per Employee"
      :value="form.peer_reviews_count ?? '—'"
      hint="Number of coworkers each employee must evaluate during a review cycle."
    />

    <div v-else class="space-y-2 max-w-sm">
      <label class="text-xs font-bold text-slate-500 dark:text-slate-300">Peer Reviews per Employee</label>
      <div class="flex items-center">
        <input
          v-model.number="form.peer_reviews_count"
          type="number"
          min="1"
          step="1"
          class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-l-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
        />
        <span class="bg-slate-100 dark:bg-slate-700 border-t border-b border-r border-slate-200 dark:border-slate-700 px-4 py-3 rounded-r-xl text-xs font-bold text-slate-400 whitespace-nowrap">peers</span>
      </div>
      <p class="text-[10px] text-slate-400">
        Number of coworkers each employee must evaluate during a review cycle.
      </p>
    </div>

    <div
      v-if="readonly"
      class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2"
      :class="!form.apply_review_to_salary ? 'opacity-40' : ''"
    >
      <PolicyReadonlyValue label="&quot;Excellent&quot; Appraisal Salary Increase (%)" :value="`${form.excellent_adjustment_percent ?? '—'}%`" />
      <PolicyReadonlyValue label="&quot;Good&quot; Appraisal Salary Increase (%)" :value="`${form.good_adjustment_percent ?? '—'}%`" />
      <PolicyReadonlyValue label="&quot;Poor&quot; Appraisal Salary Deduction (%)" :value="`${form.poor_adjustment_percent ?? '—'}%`" />
    </div>

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 transition-all duration-300"
      :class="!form.apply_review_to_salary ? 'opacity-40 pointer-events-none' : ''"
    >
      <div class="space-y-2">
        <label class="text-xs font-bold text-slate-500 dark:text-slate-300">"Excellent" Appraisal Salary Increase (%)</label>
        <div class="flex items-center">
          <input
            v-model.number="form.excellent_adjustment_percent"
            type="number"
            min="0"
            class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-l-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
          />
          <span class="bg-slate-100 dark:bg-slate-700 border-t border-b border-r border-slate-200 dark:border-slate-700 px-4 py-3 rounded-r-xl text-xs font-bold text-slate-400">%</span>
        </div>
        <p class="text-[10px] text-slate-400">Salary increase reward multiplier applied on monthly base wage.</p>
      </div>

      <div class="space-y-2">
        <label class="text-xs font-bold text-slate-500 dark:text-slate-300">"Good" Appraisal Salary Increase (%)</label>
        <div class="flex items-center">
          <input
            v-model.number="form.good_adjustment_percent"
            type="number"
            min="0"
            class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-l-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
          />
          <span class="bg-slate-100 dark:bg-slate-700 border-t border-b border-r border-slate-200 dark:border-slate-700 px-4 py-3 rounded-r-xl text-xs font-bold text-slate-400">%</span>
        </div>
        <p class="text-[10px] text-slate-400">Regular salary bump incentive.</p>
      </div>

      <div class="space-y-2">
        <label class="text-xs font-bold text-slate-500 dark:text-slate-300">"Poor" Appraisal Salary Deduction (%)</label>
        <div class="flex items-center">
          <input
            v-model.number="form.poor_adjustment_percent"
            type="number"
            min="0"
            class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-l-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
          />
          <span class="bg-slate-100 dark:bg-slate-700 border-t border-b border-r border-slate-200 dark:border-slate-700 px-4 py-3 rounded-r-xl text-xs font-bold text-slate-400">%</span>
        </div>
        <p class="text-[10px] text-slate-400">Base salary adjustment deduction scale applied.</p>
      </div>
    </div>

    <p class="text-[11px] text-slate-400 italic border-t border-slate-100 dark:border-slate-700 pt-4">
      Note: salary percentage fields remain as a UI placeholder; the evaluation-policy API currently persists
      apply_review_to_salary, review weights, and peer_reviews_count.
    </p>

    <BaseButton v-if="!readonly" variant="gold" :loading="evaluationPolicyStore.saving" @click="handleSave">
      <i class="fa-solid fa-floppy-disk"></i>
      Save Evaluation Policy
    </BaseButton>
  </div>
</template>

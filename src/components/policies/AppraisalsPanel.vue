<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PolicyReadonlyValue from './PolicyReadonlyValue.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useEvaluationPolicyStore } from '@/stores/evaluationPolicy.store'

const props = defineProps({
  readonly: { type: Boolean, default: false }
})

const { t } = useI18n()
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
    saveError.value = err.message || evaluationPolicyStore.error || t('policies.saveEvalFailed')
  }
}
</script>

<template>
  <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
      <div class="space-y-1">
        <h4 class="text-md font-bold text-khubrat-blue dark:text-khubrat-goldLight">{{ $t('policies.appraisalsTitle') }}</h4>
        <p class="text-xs text-slate-400">
          {{ $t('policies.appraisalsHint') }}
        </p>
      </div>
      <div class="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <span class="text-xs font-bold">{{ $t('policies.linkAppraisals') }}</span>
        <span v-if="readonly" class="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {{ form.apply_review_to_salary ? $t('common.yes') : $t('common.no') }}
        </span>
        <ToggleSwitch v-else v-model="form.apply_review_to_salary" />
      </div>
    </div>

    <BaseAlert v-if="saveSuccess" variant="success">{{ $t('policies.evalSaved') }}</BaseAlert>
    <BaseAlert v-if="saveError" variant="error">{{ saveError }}</BaseAlert>

    <PolicyReadonlyValue
      v-if="readonly"
      :label="$t('policies.peerReviews')"
      :value="form.peer_reviews_count ?? $t('common.emDash')"
      :hint="$t('policies.peerHint')"
    />

    <div v-else class="space-y-2 max-w-sm">
      <label class="text-xs font-bold text-slate-500 dark:text-slate-300">{{ $t('policies.peerReviews') }}</label>
      <div class="flex items-center">
        <input
          v-model.number="form.peer_reviews_count"
          type="number"
          min="1"
          step="1"
          class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-l-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
        />
        <span class="bg-slate-100 dark:bg-slate-700 border-t border-b border-r border-slate-200 dark:border-slate-700 px-4 py-3 rounded-r-xl text-xs font-bold text-slate-400 whitespace-nowrap">{{ $t('policies.peers') }}</span>
      </div>
      <p class="text-[10px] text-slate-400">
        {{ $t('policies.peerHint') }}
      </p>
    </div>

    <div
      v-if="readonly"
      class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2"
      :class="!form.apply_review_to_salary ? 'opacity-40' : ''"
    >
      <PolicyReadonlyValue :label="$t('policies.excellentIncrease')" :value="`${form.excellent_adjustment_percent ?? $t('common.emDash')}%`" />
      <PolicyReadonlyValue :label="$t('policies.goodIncrease')" :value="`${form.good_adjustment_percent ?? $t('common.emDash')}%`" />
      <PolicyReadonlyValue :label="$t('policies.poorDeduction')" :value="`${form.poor_adjustment_percent ?? $t('common.emDash')}%`" />
    </div>

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 transition-all duration-300"
      :class="!form.apply_review_to_salary ? 'opacity-40 pointer-events-none' : ''"
    >
      <div class="space-y-2">
        <label class="text-xs font-bold text-slate-500 dark:text-slate-300">{{ $t('policies.excellentIncrease') }}</label>
        <div class="flex items-center">
          <input
            v-model.number="form.excellent_adjustment_percent"
            type="number"
            min="0"
            class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-l-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
          />
          <span class="bg-slate-100 dark:bg-slate-700 border-t border-b border-r border-slate-200 dark:border-slate-700 px-4 py-3 rounded-r-xl text-xs font-bold text-slate-400">%</span>
        </div>
        <p class="text-[10px] text-slate-400">{{ $t('policies.excellentHint') }}</p>
      </div>

      <div class="space-y-2">
        <label class="text-xs font-bold text-slate-500 dark:text-slate-300">{{ $t('policies.goodIncrease') }}</label>
        <div class="flex items-center">
          <input
            v-model.number="form.good_adjustment_percent"
            type="number"
            min="0"
            class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-l-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
          />
          <span class="bg-slate-100 dark:bg-slate-700 border-t border-b border-r border-slate-200 dark:border-slate-700 px-4 py-3 rounded-r-xl text-xs font-bold text-slate-400">%</span>
        </div>
        <p class="text-[10px] text-slate-400">{{ $t('policies.goodHint') }}</p>
      </div>

      <div class="space-y-2">
        <label class="text-xs font-bold text-slate-500 dark:text-slate-300">{{ $t('policies.poorDeduction') }}</label>
        <div class="flex items-center">
          <input
            v-model.number="form.poor_adjustment_percent"
            type="number"
            min="0"
            class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-l-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
          />
          <span class="bg-slate-100 dark:bg-slate-700 border-t border-b border-r border-slate-200 dark:border-slate-700 px-4 py-3 rounded-r-xl text-xs font-bold text-slate-400">%</span>
        </div>
        <p class="text-[10px] text-slate-400">{{ $t('policies.poorHint') }}</p>
      </div>
    </div>

    <p class="text-[11px] text-slate-400 italic border-t border-slate-100 dark:border-slate-700 pt-4">
      {{ $t('policies.evalNote') }}
    </p>

    <BaseButton v-if="!readonly" variant="gold" :loading="evaluationPolicyStore.saving" @click="handleSave">
      <i class="fa-solid fa-floppy-disk"></i>
      {{ $t('policies.saveEval') }}
    </BaseButton>
  </div>
</template>

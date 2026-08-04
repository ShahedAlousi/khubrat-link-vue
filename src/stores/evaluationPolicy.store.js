import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { evaluationPolicyService } from '@/services/evaluationPolicy.service'

const DEFAULT_POLICY = {
  weekly_review_period: 'monthly',
  apply_review_to_salary: true,
  manager_weight: 60,
  self_weight: 10,
  peer_weight: 30,
  peer_reviews_count: 3,
  // Placeholder fields — salary adjustment percentages still shown in the UI.
  excellent_adjustment_percent: 15,
  good_adjustment_percent: 5,
  poor_adjustment_percent: 10
}

export const useEvaluationPolicyStore = defineStore('evaluationPolicy', () => {
  const policy = reactive({ ...DEFAULT_POLICY })
  const loading = ref(false)
  const saving = ref(false)
  const error = ref(null)

  function applyPolicyData(data = {}) {
    if (data.apply_review_to_salary !== undefined) {
      policy.apply_review_to_salary = Boolean(data.apply_review_to_salary)
    }
    if (data.manager_weight !== undefined) {
      policy.manager_weight = Number(data.manager_weight)
    }
    if (data.self_weight !== undefined) {
      policy.self_weight = Number(data.self_weight)
    }
    if (data.peer_weight !== undefined) {
      policy.peer_weight = Number(data.peer_weight)
    }
    if (data.peer_reviews_count !== undefined) {
      policy.peer_reviews_count = Number(data.peer_reviews_count)
    }
    if (data.excellent_adjustment_percent !== undefined) {
      policy.excellent_adjustment_percent = Number(data.excellent_adjustment_percent)
    }
    if (data.good_adjustment_percent !== undefined) {
      policy.good_adjustment_percent = Number(data.good_adjustment_percent)
    }
    if (data.poor_adjustment_percent !== undefined) {
      policy.poor_adjustment_percent = Number(data.poor_adjustment_percent)
    }
    if (data.weekly_review_period !== undefined) {
      policy.weekly_review_period = data.weekly_review_period
    }
  }

  async function fetchPolicy(companyId) {
    loading.value = true
    error.value = null
    try {
      const data = await evaluationPolicyService.get(companyId)
      applyPolicyData(data)
      return data
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to load evaluation policy.'
      console.error('[EvaluationPolicy] Fetch failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function savePolicy(companyId, payload) {
    saving.value = true
    error.value = null
    try {
      const apiPayload = {
        apply_review_to_salary: Boolean(payload.apply_review_to_salary),
        manager_weight: Number(payload.manager_weight),
        self_weight: Number(payload.self_weight),
        peer_weight: Number(payload.peer_weight),
        peer_reviews_count: Number(payload.peer_reviews_count)
      }

      const result = await evaluationPolicyService.update(companyId, apiPayload)
      applyPolicyData({ ...apiPayload, ...result })
      console.log('[EvaluationPolicy] Save succeeded:', result)
      return result
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to save evaluation policy.'
      console.error('[EvaluationPolicy] Save failed:', err)
      throw err
    } finally {
      saving.value = false
    }
  }

  return { policy, loading, saving, error, fetchPolicy, savePolicy }
})

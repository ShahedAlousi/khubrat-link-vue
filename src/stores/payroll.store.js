import { ref } from 'vue'
import { defineStore } from 'pinia'
import { advancePolicyService, salaryRulesService } from '@/services/payroll.service'

export const usePayrollStore = defineStore('payroll', () => {
  const salaryRules = ref(null)
  const currency = ref('USD')
  const loading = ref(false)
  const error = ref(null)

  const advancePolicy = ref(null)
  const loadingAdvancePolicy = ref(false)
  const savingAdvancePolicy = ref(false)

  async function fetchSalaryRules(companyId) {
    loading.value = true
    error.value = null
    try {
      const data = await salaryRulesService.list(companyId)
      salaryRules.value = data
      if (data?.currency) {
        currency.value = data.currency
      }
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // إنشاء السياسات دفعة واحدة لأول مرة
  async function saveAllCompanyPolicies(companyId, payload) {
    error.value = null
    try {
      const result = await salaryRulesService.saveAll(companyId, payload)
      salaryRules.value = payload
      currency.value = payload.base_currency || payload.currency
      return result
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // تحديث سياسة معينة (يستخدم الـ PUT endpoint)
  async function updateSalaryRule(companyId, ruleId, payload) {
    error.value = null
    try {
      const result = await salaryRulesService.updateRule(companyId, ruleId, payload)
      return result
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // جلب سياسة السلف المالية الحالية للشركة (قد تعود null إن لم تُضبط بعد)
  async function fetchAdvancePolicy(companyId) {
    loadingAdvancePolicy.value = true
    error.value = null
    try {
      const data = await advancePolicyService.get(companyId)
      advancePolicy.value = data
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loadingAdvancePolicy.value = false
    }
  }

  // إنشاء أو تحديث سياسة السلف المالية
  async function saveAdvancePolicy(companyId, payload) {
    savingAdvancePolicy.value = true
    error.value = null
    try {
      const data = await advancePolicyService.save(companyId, payload)
      advancePolicy.value = data ?? { ...payload }
      return advancePolicy.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      savingAdvancePolicy.value = false
    }
  }

  return {
    salaryRules,
    currency,
    loading,
    error,
    advancePolicy,
    loadingAdvancePolicy,
    savingAdvancePolicy,
    fetchSalaryRules,
    saveAllCompanyPolicies,
    updateSalaryRule,
    fetchAdvancePolicy,
    saveAdvancePolicy
  }
})
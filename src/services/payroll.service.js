import api from './api'

export const salaryRulesService = {
  /** GET /api/companies/{company}/salary-rules */
  list(companyId) {
    return api.get(`/companies/${companyId}/salary-rules`).then((res) => {
      // التأكد من الوصول للمصفوفة أينما كانت في الاستجابة
      return res.data?.data ?? res.data
    })
  },

  /** POST /api/companies/{company}/salary-rules (Bulk Create) */
  saveAll(companyId, payload) {
    return api.post(`/companies/${companyId}/salary-rules`, payload).then((res) => res.data)
  },

  /** PUT /api/companies/{company}/salary-rules/{rule} (Update Specific Rule) */
  updateRule(companyId, ruleId, payload) {
    return api.put(`/companies/${companyId}/salary-rules/${ruleId}`, payload).then((res) => res.data)
  }
}

export const advancePolicyService = {
  /** GET /api/companies/{company}/advance-policy */
  get(companyId) {
    return api.get(`/companies/${companyId}/advance-policy`).then((res) => {
      // الباك اند يعيد data = null في حال لم تُضبط السياسة بعد
      return res.data?.data ?? null
    })
  },

  /** PUT /api/companies/{company}/advance-policy (Create or Update) */
  save(companyId, payload) {
    return api.put(`/companies/${companyId}/advance-policy`, payload).then((res) => {
      return res.data?.data ?? res.data
    })
  }
}
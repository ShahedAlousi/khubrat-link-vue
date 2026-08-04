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
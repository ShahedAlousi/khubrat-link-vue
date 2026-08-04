import api from './api'

export const evaluationPolicyService = {
  /**
   * GET /api/companies/{company}/evaluation-policy
   * @param {string} companyId
   */
  get(companyId) {
    return api
      .get(`/companies/${companyId}/evaluation-policy`)
      .then((res) => res.data?.data ?? res.data)
  },

  /**
   * PUT /api/companies/{company}/evaluation-policy
   * @param {string} companyId
   * @param {{
   *  apply_review_to_salary: boolean,
   *  manager_weight: number,
   *  self_weight: number,
   *  peer_weight: number,
   *  peer_reviews_count: number,
   *  excellent_adjustment_percent?: number,
   *  good_adjustment_percent?: number,
   *  poor_adjustment_percent?: number
   * }} payload
   */
  update(companyId, payload) {
    return api
      .put(`/companies/${companyId}/evaluation-policy`, payload)
      .then((res) => res.data?.data ?? res.data)
  }
}

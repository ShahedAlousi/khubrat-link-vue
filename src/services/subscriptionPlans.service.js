import api from './api'

/**
 * Subscription Plans module — powers the "HR Packages Plan" tab.
 * Maps 1:1 to the "Subscription Plans" tag in the OpenAPI spec.
 */
export const subscriptionPlansService = {
  /** GET /api/subscription-plans */
  list() {
    return api.get('/subscription-plans').then((res) => res.data?.data ?? res.data)
  },

   /** GET /api/subscription-plans/all */
   listAll() {
    return api.get('/subscription-plans/all').then((res) => res.data?.data ?? res.data)
  },

  /**
   * GET /api/subscription-plans/{plan}
   * @param {string} planId
   */
  get(planId) {
    return api.get(`/subscription-plans/${planId}`).then((res) => res.data?.data ?? res.data)
  },

  /**
   * POST /api/subscription-plans
   * @param {{
   *  name: string,
   *  plan_type: string,
   *  billing_period: string,
   *  max_employees: number,
   *  price: number,
   *  is_active?: boolean,
   *  max_uses_per_company: number,
   *  description?: string
   * }} payload
   */
  create(payload) {
    return api.post('/subscription-plans', payload).then((res) => res.data)
  },

  /**
   * PUT /api/subscription-plans/{plan}
   * @param {string} planId
   * @param {object} payload same shape as create()
   */
  update(planId, payload) {
    return api.put(`/subscription-plans/${planId}`, payload).then((res) => res.data)
  },

  /**
   * DELETE /api/subscription-plans/{plan}
   * @param {string} planId
   */
  remove(planId) {
    return api.delete(`/subscription-plans/${planId}`).then((res) => res.data)
  }
}
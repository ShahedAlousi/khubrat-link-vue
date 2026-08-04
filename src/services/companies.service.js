import api from './api'

/**
 * Companies module — implements only the "manage the Khibrat company"
 * surface requested for this build:
 *   - self-service registration (used by the onboarding wizard)
 *   - list / retrieve / delete
 *   - freeze / activate
 *   - platform-wide stats used to power the dashboard
 *
 * Company Policies, HR Managers, Holidays and Subscription Plans endpoints
 * exist in the API spec but are intentionally NOT wired up here.
 */
export const companiesService = {
  /**
   * POST /api/companies/register
   * @param {{
   *  name: string,
   *  email: string,
   *  address: string,
   *  contact_name: string,
   *  phone: string,
   *  plan_id: string,
   *  payment_status: string
   * }} payload
   */
  register(payload) {
    return api.post('/companies/register', payload).then((res) => res.data)
  },

  /** GET /api/companies */
  list() {
    return api.get('/companies').then((res) => res.data?.data ?? res.data)
  },

  /**
   * GET /api/companies/{company}
   * @param {string} companyId
   */
  get(companyId) {
    return api.get(`/companies/${companyId}`).then((res) => res.data?.data ?? res.data)
  },

  /**
   * DELETE /api/companies/{company}
   * @param {string} companyId
   */
  remove(companyId) {
    return api.delete(`/companies/${companyId}`).then((res) => res.data)
  },

  /**
   * POST /api/companies/{company}/freeze
   * The spec does not document a request body for this endpoint. We still
   * forward an optional `reason` (captured from the admin in the UI, as in
   * the original design) — most Laravel controllers will just ignore
   * unexpected fields if the backend hasn't implemented it yet.
   * @param {string} companyId
   * @param {string} [reason]
   */
  freeze(companyId, reason) {
    return api.post(`/companies/${companyId}/freeze`, reason ? { reason } : {}).then((res) => res.data)
  },

  /**
   * POST /api/companies/{company}/activate
   * @param {string} companyId
   */
  activate(companyId) {
    return api.post(`/companies/${companyId}/activate`).then((res) => res.data)
  },

  /** GET /api/companies/stats */
  stats() {
    return api.get('/companies/stats').then((res) => res.data.data)
  }
}

import api from './api'

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

export const hrManagersService = {
  /**
   * GET /api/companies/{company}/hr-managers
   * @param {string} companyId
   */
  list(companyId) {
    return api
      .get(`/companies/${companyId}/hr-managers`)
      .then((res) => unwrapList(res.data?.data ?? res.data))
  },

  /**
   * GET /api/companies/{company}/hr-managers/{hr_manager}
   * @param {string} companyId
   * @param {string} hrManagerId
   */
  get(companyId, hrManagerId) {
    return api
      .get(`/companies/${companyId}/hr-managers/${hrManagerId}`)
      .then((res) => res.data?.data ?? res.data)
  },

  /**
   * POST /api/companies/{company}/hr-managers
   * @param {string} companyId
   * @param {object} payload
   */
  create(companyId, payload) {
    return api.post(`/companies/${companyId}/hr-managers`, payload).then((res) => res.data)
  },

  /**
   * PUT /api/companies/{company}/hr-managers/{hr_manager}
   * @param {string} companyId
   * @param {string} hrManagerId
   * @param {object} payload
   */
  update(companyId, hrManagerId, payload) {
    return api
      .put(`/companies/${companyId}/hr-managers/${hrManagerId}`, payload)
      .then((res) => res.data)
  },

  /**
   * DELETE /api/companies/{company}/hr-managers/{hr_manager}
   * @param {string} companyId
   * @param {string} hrManagerId
   */
  remove(companyId, hrManagerId) {
    return api
      .delete(`/companies/${companyId}/hr-managers/${hrManagerId}`)
      .then((res) => res.data)
  },

  /**
   * POST /api/companies/{company}/hr-managers/{hr_manager}/activate
   */
  activate(companyId, hrManagerId) {
    return api
      .post(`/companies/${companyId}/hr-managers/${hrManagerId}/activate`)
      .then((res) => res.data)
  },

  /**
   * POST /api/companies/{company}/hr-managers/{hr_manager}/deactivate
   */
  deactivate(companyId, hrManagerId) {
    return api
      .post(`/companies/${companyId}/hr-managers/${hrManagerId}/deactivate`)
      .then((res) => res.data)
  }
}

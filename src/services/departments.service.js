import api from './api'

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

export const departmentsService = {
  /**
   * GET /api/hr/departments
   * @param {{ search?: string, is_active?: boolean }} [params]
   */
  list(params = {}) {
    return api
      .get('/hr/departments', {
        params,
        headers: { 'Cache-Control': 'no-cache' }
      })
      .then((res) => unwrapList(res.data?.data ?? res.data))
  },

  /**
   * GET /api/hr/departments/{department}
   * @param {string} departmentId
   */
  get(departmentId) {
    return api.get(`/hr/departments/${departmentId}`).then((res) => res.data?.data ?? res.data)
  },

  /**
   * POST /api/hr/departments
   * @param {{ name: string, is_active?: boolean, manager_id?: string|null }} payload
   */
  create(payload) {
    return api.post('/hr/departments', payload).then((res) => res.data?.data ?? res.data)
  },

  /**
   * PUT /api/hr/departments/{department}
   * Assigning manager_id promotes that employee; previous manager is demoted by the backend.
   * @param {string} departmentId
   * @param {{ name?: string, is_active?: boolean, manager_id?: string|null }} payload
   */
  update(departmentId, payload) {
    return api
      .put(`/hr/departments/${departmentId}`, payload)
      .then((res) => res.data?.data ?? res.data)
  },

  /**
   * DELETE /api/hr/departments/{department}
   * Blocked with 409 when the department still has employees.
   * @param {string} departmentId
   */
  remove(departmentId) {
    return api.delete(`/hr/departments/${departmentId}`).then((res) => res.data)
  },

  /**
   * GET /api/hr/departments/{department}/employees
   * Used when assigning a department manager (employees of this department only).
   * @param {string} departmentId
   * @param {Record<string, unknown>} [params]
   */
  listEmployees(departmentId, params = {}) {
    return api
      .get(`/hr/departments/${departmentId}/employees`, { params })
      .then((res) => unwrapList(res.data?.data ?? res.data))
  }
}

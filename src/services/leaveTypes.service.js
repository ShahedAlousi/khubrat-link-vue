import api from './api'

/**
 * Leave Types — powers the "Leave Policies" tab.
 * Maps 1:1 to the "Company Policies" leave-types endpoints.
 *
 * UPDATED CONTRACT: create/update are now BULK-only — the backend accepts
 * (and expects) an array of leave types wrapped in { leave_types: [...] }
 * in a single request, instead of one call per leave type. The update
 * endpoint no longer takes a {leaveType} id in the URL either — each item's
 * own `id` inside the array tells the backend which record to update.
 */
export const leaveTypesService = {
  /** GET /api/companies/{company}/leave-types */
  list(companyId) {
    return api.get(`/companies/${companyId}/leave-types`).then((res) => res.data?.data ?? res.data)
  },

  /**
   * POST /api/companies/{company}/leave-types — bulk create
   * @param {string} companyId
   * @param {Array<{
   *  name: string,
   *  allocation_value: number,
   *  allocation_unit: string,
   *  requires_proof?: boolean,
   *  is_active?: boolean
   * }>} leaveTypes
   */
  createMany(companyId, leaveTypes) {
    return api.post(`/companies/${companyId}/leave-types`, { leave_types: leaveTypes }).then((res) => res.data)
  },
 
  /**
   * PUT /api/companies/{company}/leave-types — bulk update
   * @param {string} companyId
   * @param {Array<{ id: string, name: string, allocation_value: number, allocation_unit: string, requires_proof?: boolean, is_active?: boolean }>} leaveTypes
   */
  updateMany(companyId, leaveTypes) {
    return api.put(`/companies/${companyId}/leave-types`, { leave_types: leaveTypes }).then((res) => res.data)
  },

  /**
   * POST /api/companies/{company}/leave-types/{leaveType}/toggle — unchanged,
   * still a single-item instant switch (no body).
   * @param {string} companyId
   * @param {string} leaveTypeId
   */
  toggle(companyId, leaveTypeId) {
    return api.post(`/companies/${companyId}/leave-types/${leaveTypeId}/toggle`).then((res) => res.data)
  }

  // NOTE: no DELETE endpoint is documented for leave types.
}
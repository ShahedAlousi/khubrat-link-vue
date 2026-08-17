import api from './api'

/**
 * Attendance Policy Service
 * Handles communication with both attendance policy and location APIs.
 */
export const attendancePolicyService = {
  /**
   * GET /api/companies/{company}/attendance-policy
   * Returns the persisted policy (shift hours, grace periods, geofencing).
   *
   * @param {string} companyId
   */
  getPolicy(companyId) {
    return api
      .get(`/companies/${companyId}/attendance-policy`)
      .then((res) => res.data?.data ?? res.data)
  },

  /**
   * PUT /api/companies/{company}/attendance-policy
   * Updates only shift hours and grace periods.
   * 
   * @param {string} companyId
   * @param {{
   *  work_start_time: string,
   *  work_end_time: string,
   *  allowed_late_minutes: number,
   *  allowed_early_leave_minutes: number,
   *  allows_overtime: boolean
   * }} payload
   */
  updatePolicy(companyId, payload) {
    return api.put(`/companies/${companyId}/attendance-policy`, payload).then((res) => res.data)
  },

  /**
   * PUT /api/companies/{company}/attendance-location
   * Updates coordinates and geofencing radius.
   * 
   * @param {string} companyId
   * @param {{
   *  allowed_perimeter: number,
   *  latitude: number,
   *  longitude: number
   * }} payload
   */
  updateLocation(companyId, payload) {
    return api.put(`/companies/${companyId}/attendance-location`, payload).then((res) => res.data)
  }
}
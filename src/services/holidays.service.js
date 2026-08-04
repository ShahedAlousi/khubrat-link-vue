import api from './api'

/**
 * Holidays — powers the "Holidays & Calendar" tab.
 * Maps 1:1 to the "Holiday Policies" endpoints.
 */
export const holidaysService = {
  /** GET /api/companies/{company}/holidays */
  list(companyId) {
    return api.get(`/companies/${companyId}/holidays`).then((res) => res.data?.data ?? res.data)
  },

  /**
   * POST /api/companies/{company}/holidays
   * @param {string} companyId
   * @param {{
   *  name: string,
   *  holiday_type: string,
   *  start_date: string,
   *  end_date?: string,
   *  repeats_annually: boolean
   * }} payload
   */
  create(companyId, payload) {
    return api.post(`/companies/${companyId}/holidays`, payload).then((res) => res.data)
  },

  /**
   * PUT /api/companies/{company}/holidays/{holiday}
   * @param {string} companyId
   * @param {string} holidayId
   * @param {object} payload same shape as create()
   */
  update(companyId, holidayId, payload) {
    return api.put(`/companies/${companyId}/holidays/${holidayId}`, payload).then((res) => res.data)
  },

  /**
   * DELETE /api/companies/{company}/holidays/{holiday}
   * @param {string} companyId
   * @param {string} holidayId
   */
  remove(companyId, holidayId) {
    return api.delete(`/companies/${companyId}/holidays/${holidayId}`).then((res) => res.data)
  },

  /**
   * POST /api/companies/{company}/holidays/defaults
   * Seeds the fixed Syrian national holidays.
   * @param {string} companyId
   */
  seedDefaults(companyId) {
    return api.post(`/companies/${companyId}/holidays/defaults`).then((res) => res.data)
  },

  /**
   * DELETE /api/companies/{company}/holidays/defaults
   * Reverses seedDefaults().
   * @param {string} companyId
   */
  removeDefaults(companyId) {
    return api.delete(`/companies/${companyId}/holidays/defaults`).then((res) => res.data)
  }
}

/**
 * Weekly Holidays — the "Weekly Rest Days" selector, same tab.
 * Maps 1:1 to GET/POST /api/companies/{company}/weekly-holidays.
 */
export const weeklyHolidaysService = {
  /** GET /api/companies/{company}/weekly-holidays */
  get(companyId) {
    return api.get(`/companies/${companyId}/weekly-holidays`).then((res) => res.data?.data ?? res.data)
  },

  /**
   * POST /api/companies/{company}/weekly-holidays
   * @param {string} companyId
   * @param {string[]} weeklyHolidays e.g. ["friday", "saturday"]
   */
  update(companyId, weeklyHolidays) {
    return api
      .post(`/companies/${companyId}/weekly-holidays`, { weekly_holidays: weeklyHolidays })
      .then((res) => res.data)
  }
}

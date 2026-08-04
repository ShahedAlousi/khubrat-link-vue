import api from './api'



export const hrManagersService = {
  /**
   * POST /api/companies/{company}/hr-managers — إضافة مدير موارد بشرية جديد للشركة
   * @param {string} companyId - UUID الشركة
   * @param {{
   *   full_name: string,
   *   email: string,
   *   department_id: string,
   *   job_title: string,
   *   base_salary: number,
   *   hire_date: string,          // بصيغة YYYY-MM-DD
   *   phone?: string,
   *   employee_code?: string,
   *   education?: string,
   *   employment_type?: string,
   *   is_active?: boolean
   * }} payload
   * @returns {Promise<{ success: boolean, message: string, data: { hr_manager: object } }>}
   */
  create(companyId, payload) {
    return api.post(`/companies/${companyId}/hr-managers`, payload).then((res) => res.data)
  }
}

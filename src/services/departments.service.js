import api from './api'

export const departmentsService = {
  /**
   * GET /api/hr/departments — عرض أقسام الشركة الحالية فقط
   * @param {{ search?: string, is_active?: boolean }} [params]
   * @returns {Promise<Array<object>>}
   */
  list(params = {}) {
    return api
      .get('/hr/departments', {
        params,
        // منع الاعتماد على استجابة مخزّنة (304 Not Modified) أثناء التطوير،
        // خصوصًا عند إضافة/تعديل أقسام مباشرة على قاعدة البيانات للتجربة.
        headers: { 'Cache-Control': 'no-cache' }
      })
      .then((res) => res.data?.data ?? res.data)
  }
}

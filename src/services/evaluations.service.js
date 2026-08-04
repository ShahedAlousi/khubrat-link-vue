import api from './api'

// ============================================================================
// 1. خدمات دورات التقييم والنتائج (Evaluation Cycles & Scoring & Results)
// ============================================================================
export const evaluationCyclesService = {
  /**
   * GET /api/hr/evaluation-cycles — جلب قائمة دورات التقييم
   * @returns {Promise<any>}
   */
  list() {
    return api.get('/hr/evaluation-cycles').then((res) => res.data)
  },

  /**
   * POST /api/hr/evaluation-cycles — إنشاء دورة تقييم جديدة
   * @param {{ name: string, evaluation_template_id: string, start_date: string, end_date: string }} payload
   * @returns {Promise<any>}
   */
  create(payload) {
    return api.post('/hr/evaluation-cycles', payload).then((res) => res.data)
  },

  /**
   * GET /api/hr/evaluation-cycles/{cycle} — جلب تفاصيل دورة تقييم محددة
   * @param {string} cycleId
   * @returns {Promise<any>}
   */
  get(cycleId) {
    return api.get(`/hr/evaluation-cycles/${cycleId}`).then((res) => res.data)
  },

  /**
   * PUT /api/hr/evaluation-cycles/{cycle} — تحديث دورة تقييم
   * @param {string} cycleId
   * @param {object} payload
   * @returns {Promise<any>}
   */
  update(cycleId, payload) {
    return api.put(`/hr/evaluation-cycles/${cycleId}`, payload).then((res) => res.data)
  },

  /**
   * DELETE /api/hr/evaluation-cycles/{cycle} — حذف دورة تقييم
   * @param {string} cycleId
   * @returns {Promise<any>}
   */
  delete(cycleId) {
    return api.delete(`/hr/evaluation-cycles/${cycleId}`).then((res) => res.data)
  },

  /**
   * POST /api/hr/evaluation-cycles/{cycle}/launch — إطلاق دورة التقييم
   * @param {string} cycleId
   * @returns {Promise<any>}
   */
  launch(cycleId) {
    return api.post(`/hr/evaluation-cycles/${cycleId}/launch`).then((res) => res.data)
  },

  /**
   * POST /api/hr/evaluation-cycles/{cycle}/close — إغلاق دورة التقييم
   * @param {string} cycleId
   * @returns {Promise<any>}
   */
  close(cycleId) {
    return api.post(`/hr/evaluation-cycles/${cycleId}/close`).then((res) => res.data)
  },

  /**
   * GET /api/hr/evaluation-cycles/{cycle}/progress — جلب تقدم التقييم للموظفين
   * @param {string} cycleId
   * @returns {Promise<any>}
   */
  getProgress(cycleId) {
    return api.get(`/hr/evaluation-cycles/${cycleId}/progress`).then((res) => res.data)
  },

  /**
   * POST /api/hr/evaluation-cycles/{cycle}/employees/{employee}/reminder — إرسال تذكير لموظف
   * @param {string} cycleId
   * @param {string} employeeId
   * @returns {Promise<any>}
   */
  sendReminder(cycleId, employeeId) {
    return api.post(`/hr/evaluation-cycles/${cycleId}/employees/${employeeId}/reminder`).then((res) => res.data)
  },

  // --- Evaluation Scoring ---

  /**
   * GET /api/hr/evaluation-cycles/{cycle}/scorable-employees
   * جلب قائمة الموظفين الذين أتموا تقييماتهم وجاهزين لوضع الدرجات
   * @param {string} cycleId
   * @returns {Promise<any>}
   */
  getScorableEmployees(cycleId) {
    return api.get(`/hr/evaluation-cycles/${cycleId}/scorable-employees`).then((res) => res.data)
  },

  /**
   * GET /api/hr/evaluation-cycles/{cycle}/scoring
   * جلب إجابات الموظف وتفاصيل التقييم لوضع الدرجات
   * @param {string} cycleId
   * @param {{ employee_id: string, review_type?: string }} params
   * @returns {Promise<any>}
   */
  getScoringDetails(cycleId, params) {
    return api.get(`/hr/evaluation-cycles/${cycleId}/scoring`, { params }).then((res) => res.data)
  },

  /**
   * POST /api/hr/evaluation-cycles/{cycle}/reviews/{review}/score
   * حفظ درجات الـ HR لتقييم مكتمل
   * @param {string} cycleId
   * @param {string} reviewId
   * @param {{ scores: Array<object> }} payload
   * @returns {Promise<any>}
   */
  storeReviewScore(cycleId, reviewId, payload) {
    return api.post(`/hr/evaluation-cycles/${cycleId}/reviews/${reviewId}/score`, payload).then((res) => res.data)
  },

  // --- Evaluation Results ---

  /**
   * GET /api/hr/evaluation-cycles/{cycle}/final-results
   * جلب النتائج النهائية لجميع الموظفين في دورة التقييم
   * @param {string} cycleId
   * @returns {Promise<any>}
   */
  getFinalResults(cycleId) {
    return api.get(`/hr/evaluation-cycles/${cycleId}/final-results`).then((res) => res.data)
  },

  /**
   * GET /api/hr/evaluation-cycles/{cycle}/final-results/{employee}
   * جلب النتيجة النهائية التفصيلية لموظف محدد
   * @param {string} cycleId
   * @param {string} employeeId
   * @returns {Promise<any>}
   */
  getEmployeeFinalResult(cycleId, employeeId) {
    return api.get(`/hr/evaluation-cycles/${cycleId}/final-results/${employeeId}`).then((res) => res.data)
  },

  /**
   * POST /api/hr/evaluation-cycles/{cycle}/final-results/{employee}/finalize
   * اعتماد النتيجة النهائية للموظف
   * @param {string} cycleId
   * @param {string} employeeId
   * @returns {Promise<any>}
   */
  finalizeEmployeeScore(cycleId, employeeId) {
    return api.post(`/hr/evaluation-cycles/${cycleId}/final-results/${employeeId}/finalize`).then((res) => res.data)
  }
}

// ============================================================================
// 2. خدمات قوالب التقييم (Evaluation Templates & Questions)
// ============================================================================
export const evaluationTemplatesService = {
  /**
   * GET /api/hr/evaluation-templates
   * @param {{ archived?: boolean|number|string, only_archived?: boolean|number }} params
   * @returns {Promise<any[]>}
   */
  list(params = {}) {
    return api.get('/hr/evaluation-templates', { params }).then((res) => {
      const body = res.data
      // Normalize common Laravel / API list envelopes to a plain array.
      const list =
        (Array.isArray(body) && body) ||
        (Array.isArray(body?.data) && body.data) ||
        (Array.isArray(body?.data?.data) && body.data.data) ||
        (Array.isArray(body?.templates) && body.templates) ||
        (Array.isArray(body?.data?.templates) && body.data.templates) ||
        []

      if (!list.length) {
        console.warn('[evaluationTemplatesService.list] Empty or unrecognized list payload shape:', body)
      }
      return list
    })
  },

  /**
   * POST /api/hr/evaluation-templates
   * @param {object} payload
   * @returns {Promise<any>}
   */
  create(payload) {
    return api.post('/hr/evaluation-templates', payload).then((res) => res.data)
  },

  /**
   * GET /api/hr/evaluation-templates/{template}
   * @param {string} templateId
   * @returns {Promise<any>}
   */
  get(templateId) {
    return api.get(`/hr/evaluation-templates/${templateId}`).then((res) => res.data?.data ?? res.data)
  },

  /**
   * PUT /api/hr/evaluation-templates/{template}
   * @param {string} templateId
   * @param {object} payload
   * @returns {Promise<any>}
   */
  update(templateId, payload) {
    return api.put(`/hr/evaluation-templates/${templateId}`, payload).then((res) => res.data)
  },

  /**
   * DELETE /api/hr/evaluation-templates/{template}
   * @param {string} templateId
   * @returns {Promise<any>}
   */
  delete(templateId) {
    return api.delete(`/hr/evaluation-templates/${templateId}`).then((res) => res.data)
  },

  /**
   * POST /api/hr/evaluation-templates/{template}/duplicate
   * @param {string} templateId
   * @param {{ name: string, archive_source?: boolean }} payload
   * @returns {Promise<any>}
   */
  duplicate(templateId, payload) {
    return api.post(`/hr/evaluation-templates/${templateId}/duplicate`, payload).then((res) => res.data)
  },

  // --- Questions Management ---

  /**
   * POST /api/hr/evaluation-templates/{template}/questions
   * @param {string} templateId
   * @param {{ question: string, response_type: string, sort_order?: number, weight?: number }} payload
   * @returns {Promise<any>}
   */
  addQuestion(templateId, payload) {
    return api.post(`/hr/evaluation-templates/${templateId}/questions`, payload).then((res) => res.data)
  },

  /**
   * PUT /api/hr/evaluation-templates/{template}/questions/{question}
   * @param {string} templateId
   * @param {string} questionId
   * @param {object} payload
   * @returns {Promise<any>}
   */
  updateQuestion(templateId, questionId, payload) {
    return api.put(`/hr/evaluation-templates/${templateId}/questions/${questionId}`, payload).then((res) => res.data)
  },

  /**
   * DELETE /api/hr/evaluation-templates/{template}/questions/{question}
   * @param {string} templateId
   * @param {string} questionId
   * @returns {Promise<any>}
   */
  deleteQuestion(templateId, questionId) {
    return api.delete(`/hr/evaluation-templates/${templateId}/questions/${questionId}`).then((res) => res.data)
  }
}
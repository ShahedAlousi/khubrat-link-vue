import api from './api'
import { validateLeaveActionPayload } from '@/utils/validators'

/**
 * Management leave requests — HR / manager inbox workflow.
 * GET  /api/management/leaves/inbox
 * POST /api/management/leaves/{id}/action
 */
export const managementLeavesService = {
  /** GET /management/leaves/inbox */
  inbox() {
    return api.get('/management/leaves/inbox').then((res) => res.data?.data ?? res.data)
  },

  /**
   * POST /management/leaves/{id}/action
   * @param {string} leaveId
   * @param {{ action: 'approve'|'reject', role_context: 'manager'|'hr', rejection_reason?: string|null }} payload
   */
  executeAction(leaveId, payload) {
    const errors = validateLeaveActionPayload(payload)
    if (Object.keys(errors).length) {
      return Promise.reject({ message: Object.values(errors)[0], errors })
    }

    const body = {
      action: payload.action,
      role_context: payload.role_context
    }

    if (payload.action === 'reject') {
      body.rejection_reason = String(payload.rejection_reason || '').trim()
    }

    return api.post(`/management/leaves/${leaveId}/action`, body).then((res) => res.data)
  }
}

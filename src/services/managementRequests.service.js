import api from './api'
import { validateLeaveActionPayload } from '@/utils/validators'

/**
 * Normalize inbox payload: array, single object, or paginated `{ data: [...] }`.
 * @param {*} payload
 * @returns {object[]}
 */
function unwrapInbox(payload) {
  const root = payload?.data ?? payload
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.data)) return root.data
  if (root && typeof root === 'object' && root.id) return [root]
  return []
}

/**
 * Unwrap a Laravel paginator: `{ success, data: { data: [...], current_page, ... } }`.
 * @param {*} payload
 * @returns {{ items: object[], meta: object }}
 */
function unwrapPaginated(payload) {
  const root = payload?.data ?? payload

  if (Array.isArray(root)) {
    return {
      items: root,
      meta: { current_page: 1, last_page: 1, per_page: root.length, total: root.length }
    }
  }

  const items = Array.isArray(root?.data) ? root.data : []
  return {
    items,
    meta: {
      current_page: root?.current_page ?? 1,
      last_page: root?.last_page ?? 1,
      per_page: root?.per_page ?? items.length,
      total: root?.total ?? items.length,
      from: root?.from ?? null,
      to: root?.to ?? null
    }
  }
}

/** Unwrap a single-resource envelope: `{ success, data: {...} }`. */
function unwrapResource(payload) {
  return payload?.data ?? payload ?? null
}

/**
 * Parse decimal strings the API sends for money/units (e.g. "200.00").
 * @param {*} value
 * @returns {number|null}
 */
function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Strip absolute backend origin so storage files go through our authenticated `api` client.
 * e.g. http://127.0.0.1:8000/storage/foo.pdf → /storage/foo.pdf
 * @param {string|null|undefined} rawUrl
 * @returns {string|null}
 */
export function toRelativeAttachmentPath(rawUrl) {
  if (rawUrl === null || rawUrl === undefined) return null
  const value = String(rawUrl).trim()
  if (!value) return null

  try {
    if (/^https?:\/\//i.test(value)) {
      const parsed = new URL(value)
      const relative = `${parsed.pathname}${parsed.search}`
      return relative || null
    }
  } catch {
    // fall through — treat as path-like
  }

  return value.startsWith('/') ? value : `/${value}`
}

/**
 * Absolute storage URL on the API host (https + ngrok skip flag).
 * Use for <img>/<iframe>/<a>; do not go through `/api`.
 */
export function resolveAttachmentDisplayUrl(rawUrl) {
  const path = toRelativeAttachmentPath(rawUrl)
  if (!path) return ''

  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
  try {
    const api = new URL(apiBase, typeof window !== 'undefined' ? window.location.href : 'http://localhost')
    const resolved = new URL(path, api.origin)
    if (resolved.hostname.includes('ngrok')) {
      resolved.searchParams.set('ngrok-skip-browser-warning', 'true')
    }
    return resolved.href
  } catch {
    return path
  }
}

/** Shared employee shape across the three request families. */
function normalizeEmployeeBlock(row) {
  const employee = row.employee ?? null
  const department = row.department ?? employee?.department ?? null

  return {
    employee_id: row.employee_id ?? employee?.id ?? null,
    employee_name:
      row.employee_name ??
      employee?.full_name ??
      employee?.name ??
      'Employee',
    department_name:
      row.department_name ??
      employee?.department_name ??
      department?.name ??
      null,
    job_title: row.job_title ?? employee?.job_title ?? null,
    basic_salary: toNumber(row.basic_salary ?? employee?.basic_salary)
  }
}

/**
 * Map API leave rows into a stable shape for the requests UI.
 * Supports the new leave model (`requested_value`, `attachment_url`, nested relations).
 * @param {object} row
 */
export function normalizeLeaveRequest(row) {
  if (!row || typeof row !== 'object') return null

  const employee = row.employee ?? null
  const leaveType = row.leave_type ?? row.leaveType ?? null
  const department = row.department ?? employee?.department ?? null

  const rawValue = row.requested_value ?? row.duration_days ?? null
  const durationDays = rawValue === null || rawValue === undefined || rawValue === ''
    ? null
    : Number(rawValue)

  const rawAttachment = row.attachment_url || row.attachment || null

  return {
    ...row,
    request_type: 'leave',
    id: row.id,
    company_id: row.company_id ?? null,
    employee_id: row.employee_id ?? employee?.id ?? null,
    leave_type_id: row.leave_type_id ?? leaveType?.id ?? null,
    employee_name:
      row.employee_name ??
      employee?.full_name ??
      employee?.name ??
      'Employee',
    department_name:
      row.department_name ??
      department?.name ??
      employee?.department_name ??
      null,
    leave_type_name:
      row.leave_type_name ??
      leaveType?.name ??
      leaveType?.title ??
      null,
    start_date: row.start_date ?? null,
    end_date: row.end_date ?? null,
    start_time: row.start_time ?? null,
    end_time: row.end_time ?? null,
    requested_value: row.requested_value ?? null,
    duration_days: Number.isFinite(durationDays) ? durationDays : null,
    remaining_balance_days:
      row.remaining_balance_days ?? row.remaining_balance ?? null,
    attachment_url: toRelativeAttachmentPath(rawAttachment),
    reason: row.reason ?? null,
    status: row.status ?? 'pending',
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null
  }
}

/**
 * TODO(backend-contract): the installment payload is not documented yet.
 * Fields below are a defensive guess — revisit once `/installments/{id}/pay`
 * and the `installments[]` array are specified.
 * @param {object} row
 */
export function normalizeAdvanceInstallment(row) {
  if (!row || typeof row !== 'object') return null

  return {
    ...row,
    id: row.id ?? null,
    sequence: row.sequence ?? row.installment_number ?? row.number ?? null,
    due_date: row.due_date ?? row.scheduled_for ?? null,
    amount: toNumber(row.amount ?? row.installment_amount),
    status: row.status ?? 'pending',
    paid_at: row.paid_at ?? null
  }
}

/**
 * Map salary advance rows (list + details) into a stable UI shape.
 * @param {object} row
 */
export function normalizeAdvanceRequest(row) {
  if (!row || typeof row !== 'object') return null

  const installments = Array.isArray(row.installments)
    ? row.installments.map(normalizeAdvanceInstallment).filter(Boolean)
    : []

  return {
    ...row,
    ...normalizeEmployeeBlock(row),
    request_type: 'advance',
    id: row.id,
    requested_amount: toNumber(row.requested_amount),
    repayment_months: toNumber(row.repayment_months),
    monthly_installment: toNumber(row.monthly_installment),
    reason: row.reason ?? null,
    rejection_reason: row.rejection_reason ?? null,
    status: row.status ?? 'pending',
    approved_by_manager: row.approved_by_manager ?? null,
    approved_by_hr: row.approved_by_hr ?? null,
    installments,
    created_at: row.created_at ?? null
  }
}

/**
 * Map overtime rows (list + details) into a stable UI shape.
 * @param {object} row
 */
export function normalizeOvertimeRequest(row) {
  if (!row || typeof row !== 'object') return null

  return {
    ...row,
    ...normalizeEmployeeBlock(row),
    request_type: 'overtime',
    id: row.id,
    request_date: row.request_date ?? null,
    duration_type: row.duration_type ?? 'hour',
    units_requested: toNumber(row.units_requested),
    units_approved: toNumber(row.units_approved),
    reason: row.reason ?? null,
    status: row.status ?? 'pending',
    rejection_reason: row.rejection_reason ?? null,
    review_notes: row.review_notes ?? null,
    estimated_amount: toNumber(row.estimated_amount),
    calculated_amount: toNumber(row.calculated_amount),
    approved_by_manager: row.approved_by_manager ?? null,
    approved_by_hr: row.approved_by_hr ?? null,
    dept_approved_at: row.dept_approved_at ?? null,
    hr_registered_at: row.hr_registered_at ?? null,
    created_at: row.created_at ?? null
  }
}

/**
 * Build the shared approve/reject body used by all three workflows.
 * @param {{ action: 'approve'|'reject', role_context: 'manager'|'hr', rejection_reason?: string|null }} payload
 */
function buildActionBody(payload) {
  const body = {
    action: payload.action,
    role_context: payload.role_context
  }

  if (payload.action === 'reject') {
    body.rejection_reason = String(payload.rejection_reason || '').trim()
  }

  return body
}

/**
 * Management requests — HR / manager inbox workflows for the three request families.
 *
 * Leaves:    GET  /api/management/leaves/inbox
 *            POST /api/management/leaves/{id}/action
 * Advances:  GET  /api/management/advances
 *            GET  /api/management/advances/{id}
 *            POST /api/management/advances/{id}/action
 *            POST /api/management/advances/{id}/installments/{installmentId}/pay
 * Overtime:  GET  /api/management/overtime
 *            GET  /api/management/overtime/{id}
 *            POST /api/management/overtime/{id}/action
 */
export const managementRequestsService = {
  // ---------------------------------------------------------------- Leaves
  /** GET /management/leaves/inbox */
  inbox() {
    return api.get('/management/leaves/inbox').then((res) => {
      const rows = unwrapInbox(res.data)
      return rows.map(normalizeLeaveRequest).filter(Boolean)
    })
  },

  /**
   * Fetch a leave supporting document as a Blob (for download).
   * In Vite dev the request goes same-origin through `/storage` (proxied).
   * @param {string} attachmentPath relative path or absolute storage URL
   * @returns {Promise<Blob>}
   */
  fetchAttachment(attachmentPath) {
    const relative = toRelativeAttachmentPath(attachmentPath)
    const isDev = import.meta.env.DEV
    const requestUrl = isDev ? relative : resolveAttachmentDisplayUrl(attachmentPath)

    return api
      .get(requestUrl, {
        ...(isDev && typeof window !== 'undefined' ? { baseURL: window.location.origin } : {}),
        responseType: 'blob',
        headers: { Accept: '*/*' }
      })
      .then(async (res) => {
        const blob = res.data
        if (!(blob instanceof Blob)) return blob

        const type = (blob.type || '').toLowerCase()
        if (!type.includes('text/html') && !type.includes('application/json')) return blob

        let message = 'Failed to load the attachment file.'
        try {
          const text = await blob.text()
          if (type.includes('json')) {
            const json = JSON.parse(text)
            if (json?.message) message = json.message
          }
        } catch {
          // keep default message
        }
        return Promise.reject({ message })
      })
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

    return api
      .post(`/management/leaves/${leaveId}/action`, buildActionBody(payload))
      .then((res) => res.data)
  },

  // -------------------------------------------------------------- Advances
  /**
   * GET /management/advances
   * @param {{ status?: string, per_page?: number, page?: number }} [params]
   * @returns {Promise<{ items: object[], meta: object }>}
   */
  listAdvances(params = {}) {
    const query = {}
    if (params.status && params.status !== 'all') query.status = params.status
    if (params.per_page) query.per_page = params.per_page
    if (params.page) query.page = params.page

    return api.get('/management/advances', { params: query }).then((res) => {
      const { items, meta } = unwrapPaginated(res.data)
      return { items: items.map(normalizeAdvanceRequest).filter(Boolean), meta }
    })
  },

  /**
   * GET /management/advances/{id}
   * @param {string} advanceId
   */
  getAdvance(advanceId) {
    return api
      .get(`/management/advances/${advanceId}`)
      .then((res) => normalizeAdvanceRequest(unwrapResource(res.data)))
  },

  /**
   * POST /management/advances/{id}/action
   * @param {string} advanceId
   * @param {{ action: 'approve'|'reject', role_context: 'manager'|'hr', rejection_reason?: string|null }} payload
   */
  executeAdvanceAction(advanceId, payload) {
    const errors = validateLeaveActionPayload(payload)
    if (Object.keys(errors).length) {
      return Promise.reject({ message: Object.values(errors)[0], errors })
    }

    return api
      .post(`/management/advances/${advanceId}/action`, buildActionBody(payload))
      .then((res) => res.data)
  },

  /**
   * POST /management/advances/{id}/installments/{installmentId}/pay — HR only.
   * TODO(backend-contract): response body is still unspecified; we return it raw.
   * @param {string} advanceId
   * @param {string} installmentId
   */
  payAdvanceInstallment(advanceId, installmentId) {
    return api
      .post(`/management/advances/${advanceId}/installments/${installmentId}/pay`)
      .then((res) => res.data)
  },

  // -------------------------------------------------------------- Overtime
  /**
   * GET /management/overtime
   * @param {{ status?: string, per_page?: number, page?: number }} [params]
   * @returns {Promise<{ items: object[], meta: object }>}
   */
  listOvertime(params = {}) {
    const query = {}
    if (params.status && params.status !== 'all') query.status = params.status
    if (params.per_page) query.per_page = params.per_page
    if (params.page) query.page = params.page

    return api.get('/management/overtime', { params: query }).then((res) => {
      const { items, meta } = unwrapPaginated(res.data)
      return { items: items.map(normalizeOvertimeRequest).filter(Boolean), meta }
    })
  },

  /**
   * GET /management/overtime/{id}
   * @param {string} overtimeId
   */
  getOvertime(overtimeId) {
    return api
      .get(`/management/overtime/${overtimeId}`)
      .then((res) => normalizeOvertimeRequest(unwrapResource(res.data)))
  },

  /**
   * POST /management/overtime/{id}/action
   * @param {string} overtimeId
   * @param {{
   *   action: 'approve'|'reject',
   *   role_context: 'manager'|'hr',
   *   hours_approved?: number|null,
   *   rejection_reason?: string|null,
   *   review_notes?: string|null
   * }} payload
   */
  executeOvertimeAction(overtimeId, payload) {
    const errors = validateLeaveActionPayload(payload)

    const hoursApproved = payload.hours_approved
    if (hoursApproved !== null && hoursApproved !== undefined && hoursApproved !== '') {
      const parsed = Number(hoursApproved)
      if (!Number.isInteger(parsed) || parsed < 0) {
        errors.hours_approved = 'Approved hours must be a non-negative whole number.'
      }
    }

    if (Object.keys(errors).length) {
      return Promise.reject({ message: Object.values(errors)[0], errors })
    }

    const body = buildActionBody(payload)

    if (payload.action === 'approve' && hoursApproved !== null && hoursApproved !== undefined && hoursApproved !== '') {
      body.hours_approved = Number(hoursApproved)
    }

    const reviewNotes = String(payload.review_notes || '').trim()
    if (reviewNotes) body.review_notes = reviewNotes

    return api.post(`/management/overtime/${overtimeId}/action`, body).then((res) => res.data)
  }
}

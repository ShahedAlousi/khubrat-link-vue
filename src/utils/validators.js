// دوال تحقق من صحة المدخلات (إيميل صحيح، كلمة مرور قوية).

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

export function isRequired(value) {
  return String(value ?? '').trim().length > 0
}

export function minLength(value, length) {
  return String(value ?? '').length >= length
}

/** Syrian mobile: starts with 09 and is exactly 10 digits. */
export function isValidPhone(value) {
  if (!value) return true
  return /^09[0-9]{8}$/.test(String(value).trim())
}

/** Hire date must be a valid date and must not be in the future. */
export function isValidHireDate(value) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return date.getTime() <= today.getTime()
}

/** Birth date is optional; when provided it must be a valid date not in the future. */
export function isValidBirthDate(value) {
  if (!value) return true
  return isValidHireDate(value)
}

/**
 * Optional analytics year query param (OpenAPI: required false, type integer).
 * Empty / null / undefined is valid; when provided must be a whole year.
 */
export function isValidAnalyticsYear(value) {
  if (value === null || value === undefined || value === '') return true
  const n = Number(value)
  return Number.isInteger(n) && n >= 2000 && n <= 2100
}

/**
 * Optional analytics month query param (OpenAPI: required false, type integer).
 * Empty / null / undefined is valid; when provided must be 1–12.
 */
export function isValidAnalyticsMonth(value) {
  if (value === null || value === undefined || value === '') return true
  const n = Number(value)
  return Number.isInteger(n) && n >= 1 && n <= 12
}

const LEAVE_ACTIONS = ['approve', 'reject']
const LEAVE_ROLE_CONTEXTS = ['manager', 'hr']

/** Leave workflow action (OpenAPI required: action). */
export function isValidLeaveAction(value) {
  return LEAVE_ACTIONS.includes(String(value || '').trim())
}

/** Reviewer role context (OpenAPI required: role_context). */
export function isValidLeaveRoleContext(value) {
  return LEAVE_ROLE_CONTEXTS.includes(String(value || '').trim())
}

/**
 * Validate POST /management/leaves/{id}/action body.
 * Required keys per contract: action, role_context.
 * rejection_reason is required when action is "reject".
 */
export function validateLeaveActionPayload(payload = {}) {
  const errors = {}
  const action = String(payload.action ?? '').trim()
  const roleContext = String(payload.role_context ?? '').trim()
  const rejectionReason = String(payload.rejection_reason ?? '').trim()

  if (!isValidLeaveAction(action)) {
    errors.action = 'Action must be approve or reject.'
  }
  if (!isValidLeaveRoleContext(roleContext)) {
    errors.role_context = 'Role context must be manager or hr.'
  }
  if (action === 'reject' && !isRequired(rejectionReason)) {
    errors.rejection_reason = 'Rejection reason is required.'
  }

  return errors
}

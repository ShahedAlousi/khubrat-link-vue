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

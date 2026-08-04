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

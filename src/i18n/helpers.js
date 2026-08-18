import { i18n } from './instance'
import { LOCALE_META, DEFAULT_LOCALE } from './constants'

export function t(key, params) {
  return i18n.global.t(key, params)
}

export function te(key) {
  return i18n.global.te(key)
}

export function currentLocale() {
  return i18n.global.locale.value || DEFAULT_LOCALE
}

export function currentIntlLocale() {
  return LOCALE_META[currentLocale()]?.intl || LOCALE_META[DEFAULT_LOCALE].intl
}

export function humanizeStatus(value) {
  if (value == null || value === '') return '—'
  return String(value).replaceAll('_', ' ').replaceAll('-', ' ')
}

export function translateStatus(value) {
  if (value == null || value === '') return t('common.emDash')
  const normalized = String(value).trim().toLowerCase().replace(/[\s-]+/g, '_')
  const key = `status.${normalized}`
  return te(key) ? t(key) : humanizeStatus(value)
}

export function translateLeaveTypeName(name) {
  if (!name) return ''
  const key = `leaveTypes.names.${name}`
  return te(key) ? t(key) : name
}

export function translateLeaveTypeTerms(name, fallback = '') {
  if (!name) return fallback
  const key = `leaveTypes.terms.${name}`
  return te(key) ? t(key) : fallback
}

export function translateRole(role) {
  if (!role) return t('roles.tenantAdmin')
  const key = `roles.${role}`
  return te(key) ? t(key) : role
}

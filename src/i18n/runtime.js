import { i18n } from './instance'
import { applyLocale as persistAndApplyDocument, initLocale as resolveBootLocale, syncLocaleForUser as resolveUserLocale } from './locale'
import { applyChartLocale } from '@/utils/chart-setup'

export function setI18nLocale(locale) {
  i18n.global.locale.value = locale
  applyChartLocale(locale)
}

export function initLocale(userId) {
  const locale = resolveBootLocale(userId)
  setI18nLocale(locale)
  return locale
}

export function syncLocaleForUser(userId) {
  const locale = resolveUserLocale(userId)
  setI18nLocale(locale)
  return locale
}

export function changeLocale(locale, userId) {
  const applied = persistAndApplyDocument(locale, { userId })
  setI18nLocale(applied)
  return applied
}

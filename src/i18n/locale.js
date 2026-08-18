import { LOCALE_META, DEFAULT_LOCALE, GUEST_LOCALE_KEY, isSupportedLocale, userLocaleKey } from './constants'

function readGuestLocale() {
  try {
    const stored = localStorage.getItem(GUEST_LOCALE_KEY)
    return isSupportedLocale(stored) ? stored : DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

export function readUserLocale(userId) {
  if (!userId) return null
  try {
    const stored = localStorage.getItem(userLocaleKey(userId))
    return isSupportedLocale(stored) ? stored : null
  } catch {
    return null
  }
}

export function readInitialLocale(userId) {
  return readUserLocale(userId) || readGuestLocale()
}

export function persistLocale(locale, userId) {
  if (!isSupportedLocale(locale)) return
  try {
    localStorage.setItem(GUEST_LOCALE_KEY, locale)
    if (userId) localStorage.setItem(userLocaleKey(userId), locale)
  } catch {
    // Storage may be unavailable (private mode); language still applies for this session.
  }
}

export function applyDocumentLocale(locale) {
  if (typeof document === 'undefined') return
  const meta = LOCALE_META[locale] || LOCALE_META[DEFAULT_LOCALE]
  document.documentElement.lang = meta.htmlLang
  document.documentElement.dir = meta.dir
  document.documentElement.classList.toggle('locale-ar', locale === 'ar')
}

export function applyLocale(locale, { userId } = {}) {
  const next = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE
  persistLocale(next, userId)
  applyDocumentLocale(next)

  // Lazy import to keep this module free of the vue-i18n instance at parse time for the HTML bootstrap path.
  return next
}

export function initLocale(userId) {
  const locale = readInitialLocale(userId)
  applyDocumentLocale(locale)
  return locale
}

export function syncLocaleForUser(userId) {
  if (!userId) return initLocale()
  const stored = readUserLocale(userId)
  if (stored) {
    applyDocumentLocale(stored)
    persistLocale(stored, userId)
    return stored
  }
  const current = readGuestLocale()
  persistLocale(current, userId)
  applyDocumentLocale(current)
  return current
}

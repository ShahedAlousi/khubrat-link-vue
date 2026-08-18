export const SUPPORTED_LOCALES = ['en', 'ar']
export const DEFAULT_LOCALE = 'en'

export const GUEST_LOCALE_KEY = 'khubrat_locale'

export const LOCALE_META = {
  en: {
    code: 'en',
    dir: 'ltr',
    htmlLang: 'en',
    intl: 'en-US',
    shortLabel: 'EN',
    nativeLabel: 'English'
  },
  ar: {
    code: 'ar',
    dir: 'rtl',
    htmlLang: 'ar',
    intl: 'ar-SY-u-nu-latn',
    shortLabel: 'AR',
    nativeLabel: 'العربية'
  }
}

export function userLocaleKey(userId) {
  return `khubrat_locale_user_${userId}`
}

export function isSupportedLocale(value) {
  return SUPPORTED_LOCALES.includes(value)
}

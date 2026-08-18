import { createI18n } from 'vue-i18n'
import en from './locales/en'
import ar from './locales/ar'
import { DEFAULT_LOCALE } from './constants'
import { applyDocumentLocale, readInitialLocale } from './locale'

const initialLocale = readInitialLocale()
applyDocumentLocale(initialLocale)

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: DEFAULT_LOCALE,
  globalInjection: true,
  missingWarn: false,
  fallbackWarn: false,
  messages: { en, ar }
})

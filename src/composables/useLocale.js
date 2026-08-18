import { computed } from 'vue'
import { LOCALE_META, SUPPORTED_LOCALES } from '@/i18n/constants'
import { i18n } from '@/i18n/instance'
import { changeLocale } from '@/i18n/runtime'
import { useAuthStore } from '@/stores/auth.store'

export function useLocale() {
  const authStore = useAuthStore()
  const locale = computed(() => i18n.global.locale.value)
  const isRtl = computed(() => locale.value === 'ar')
  const meta = computed(() => LOCALE_META[locale.value] || LOCALE_META.en)

  function setLocale(next) {
    changeLocale(next, authStore.user?.id)
  }

  return {
    locale,
    isRtl,
    meta,
    locales: SUPPORTED_LOCALES.map((code) => LOCALE_META[code]),
    setLocale
  }
}

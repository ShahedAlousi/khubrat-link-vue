<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocale } from '@/composables/useLocale'

const props = defineProps({
  variant: {
    type: String,
    default: 'settings',
    validator: (value) => ['auth', 'settings', 'compact'].includes(value)
  }
})

const { t } = useI18n()
const { locale, locales, setLocale } = useLocale()

const isAuth = computed(() => props.variant === 'auth')
const isCompact = computed(() => props.variant === 'compact')
</script>

<template>
  <!-- Formal segmented control for authentication screens -->
  <div v-if="isAuth" class="flex flex-col items-center gap-2">
    <p class="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/55">
      {{ t('auth.languagePrompt') }}
    </p>
    <div
      class="inline-flex items-center rounded-full border border-white/20 bg-white/10 p-1 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-md"
      role="group"
      :aria-label="t('settings.language')"
    >
      <button
        v-for="item in locales"
        :key="item.code"
        type="button"
        class="min-w-[7.5rem] rounded-full px-4 py-2 text-xs font-bold tracking-wide transition-all duration-200"
        :class="
          locale === item.code
            ? 'bg-gradient-to-r from-[#fcd88a] to-[#e3b76a] text-[#061c3f] shadow-sm'
            : 'text-white/75 hover:text-white hover:bg-white/10'
        "
        :aria-pressed="locale === item.code"
        @click="setLocale(item.code)"
      >
        {{ item.nativeLabel }}
      </button>
    </div>
  </div>

  <!-- Settings row: matches the theme toggle buttons -->
  <div v-else-if="!isCompact" class="flex gap-2">
    <button
      v-for="item in locales"
      :key="item.code"
      type="button"
      class="px-4 py-2 rounded-xl text-xs font-bold border transition-all"
      :class="
        locale === item.code
          ? 'bg-khubrat-blue text-white border-khubrat-blue'
          : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300'
      "
      :aria-pressed="locale === item.code"
      @click="setLocale(item.code)"
    >
      {{ item.nativeLabel }}
    </button>
  </div>

  <!-- Compact header chip -->
  <div
    v-else
    class="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-700 p-0.5"
    role="group"
    :aria-label="t('settings.language')"
  >
    <button
      v-for="item in locales"
      :key="item.code"
      type="button"
      class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all"
      :class="
        locale === item.code
          ? 'bg-white dark:bg-slate-600 text-khubrat-blue dark:text-khubrat-goldLight shadow-sm'
          : 'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white'
      "
      :aria-pressed="locale === item.code"
      @click="setLocale(item.code)"
    >
      {{ item.shortLabel }}
    </button>
  </div>
</template>

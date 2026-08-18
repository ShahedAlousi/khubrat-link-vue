<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'

const route = useRoute()
const { t } = useI18n()
const { theme, toggleTheme } = useTheme()

const pageTitle = computed(() => t(route.meta?.titleKey || 'nav.company.policyFull'))
</script>

<template>
  <header
    class="h-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 flex items-center justify-between z-10"
  >
    <div class="flex items-center gap-4">
      <h2 class="text-xl font-bold text-khubrat-blue dark:text-khubrat-goldLight">{{ pageTitle }}</h2>
    </div>

    <div class="flex items-center gap-4">
      <button
        class="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 transition-all duration-150"
        :title="$t('settings.toggleTheme')"
        @click="toggleTheme"
      >
        <i class="fa-solid" :class="theme === 'dark' ? 'fa-sun' : 'fa-moon'"></i>
      </button>

      <LanguageSwitcher variant="compact" />
    </div>
  </header>
</template>

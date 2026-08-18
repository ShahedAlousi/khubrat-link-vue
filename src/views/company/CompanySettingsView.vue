<script setup>
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth.store'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'
import SupportChatWidget from '@/components/dashboard/SupportChatWidget.vue'
import SubscriptionStatusCard from '@/components/subscription/SubscriptionStatusCard.vue'

const { theme, setTheme } = useTheme()
const authStore = useAuthStore()
</script>

<template>
  <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
    <div class="space-y-6">
      <SubscriptionStatusCard v-if="!authStore.isDepartmentManager" />

      <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
        <h4 class="text-md font-bold text-khubrat-blue dark:text-white">{{ $t('settings.appearance') }}</h4>

        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ $t('settings.theme') }}</p>
            <p class="text-xs text-slate-400">{{ $t('settings.themeHint') }}</p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button
              class="px-4 py-2 rounded-xl text-xs font-bold border transition-all"
              :class="theme === 'light' ? 'bg-khubrat-blue text-white border-khubrat-blue' : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300'"
              @click="setTheme('light')"
            >
              <i class="fa-solid fa-sun me-1"></i> {{ $t('settings.light') }}
            </button>
            <button
              class="px-4 py-2 rounded-xl text-xs font-bold border transition-all"
              :class="theme === 'dark' ? 'bg-khubrat-blue text-white border-khubrat-blue' : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300'"
              @click="setTheme('dark')"
            >
              <i class="fa-solid fa-moon me-1"></i> {{ $t('settings.dark') }}
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-700 pt-5">
          <div>
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ $t('settings.language') }}</p>
            <p class="text-xs text-slate-400">{{ $t('settings.languageHint') }}</p>
          </div>
          <LanguageSwitcher variant="settings" />
        </div>
      </div>
    </div>

    <SupportChatWidget />
  </section>
</template>

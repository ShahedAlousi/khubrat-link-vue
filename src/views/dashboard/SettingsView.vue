<script setup>
import { computed, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useCompaniesStore } from '@/stores/companies.store'
import SupportChatWidget from '@/components/dashboard/SupportChatWidget.vue'

const { theme, setTheme } = useTheme()
const companiesStore = useCompaniesStore()

onMounted(() => {
  if (!companiesStore.stats) companiesStore.fetchStats()
})

const autoDeletionDays = computed(() => companiesStore.stats?.summary?.auto_deletion_period_days ?? '—')
</script>

<template>
  <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
    <div class="space-y-6">
      <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
        <h4 class="text-md font-bold text-khubrat-blue dark:text-white">Appearance</h4>

        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Interface theme</p>
            <p class="text-xs text-slate-400">Stored locally on this device.</p>
          </div>
          <div class="flex gap-2">
            <button
              class="px-4 py-2 rounded-xl text-xs font-bold border transition-all"
              :class="theme === 'light' ? 'bg-khubrat-blue text-white border-khubrat-blue' : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300'"
              @click="setTheme('light')"
            >
              <i class="fa-solid fa-sun mr-1"></i> Light
            </button>
            <button
              class="px-4 py-2 rounded-xl text-xs font-bold border transition-all"
              :class="theme === 'dark' ? 'bg-khubrat-blue text-white border-khubrat-blue' : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300'"
              @click="setTheme('dark')"
            >
              <i class="fa-solid fa-moon mr-1"></i> Dark
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-5">
          <div>
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Language</p>
            <p class="text-xs text-slate-400">Localization is not part of this build's scope yet.</p>
          </div>
          <span class="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-300">
            English (EN)
          </span>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <h4 class="text-md font-bold text-khubrat-blue dark:text-white">Platform Policy</h4>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Auto-deletion period</p>
            <p class="text-xs text-slate-400">For companies with non-renewed subscriptions.</p>
          </div>
          <span class="text-lg font-black text-khubrat-blue dark:text-khubrat-goldLight">{{ autoDeletionDays }} days</span>
        </div>
        <p class="text-[11px] text-slate-400 italic">
          Read-only — sourced from platform stats. No update endpoint was documented in the current API spec.
        </p>
      </div>
    </div>

    <SupportChatWidget />
  </section>
</template>

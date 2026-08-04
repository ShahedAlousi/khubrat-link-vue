<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()
const { theme, toggleTheme } = useTheme()

const pageTitle = computed(() => route.meta?.title || 'Company Policy Configuration')
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
        title="Toggle Theme Mode"
        @click="toggleTheme"
      >
        <i class="fa-solid" :class="theme === 'dark' ? 'fa-sun' : 'fa-moon'"></i>
      </button>

      <div
        class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-200"
      >
        <i class="fa-solid fa-globe"></i>
        <span>EN</span>
      </div>
    </div>
  </header>
</template>

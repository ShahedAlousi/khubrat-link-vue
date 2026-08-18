<script setup>
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
</script>

<template>
  <section class="h-full flex items-center justify-center">
    <div class="max-w-md text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-10 shadow-sm">
      <div class="w-14 h-14 mx-auto rounded-2xl bg-khubrat-blue/10 dark:bg-khubrat-blue/30 text-khubrat-blue dark:text-khubrat-goldLight flex items-center justify-center text-2xl mb-4">
        <i class="fa-solid fa-envelope-open-text"></i>
      </div>
      <h3 class="text-lg font-bold text-khubrat-blue dark:text-white mb-2">{{ $t('companyDashboard.requestsPlaceholder') }}</h3>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        <i18n-t keypath="companyDashboard.placeholderBody" tag="span">
          <template #policies>
            <router-link
              v-if="authStore.canManagePolicies"
              :to="{ name: 'company-policies' }"
              class="font-bold underline"
            >
              {{ $t('nav.company.policies') }}
            </router-link>
            <span v-else>{{ $t('nav.company.policies') }}</span>
          </template>
        </i18n-t>
      </p>
    </div>
  </section>
</template>

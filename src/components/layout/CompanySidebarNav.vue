<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLogo from '@/components/common/AppLogo.vue'
import { useAuthStore } from '@/stores/auth.store'
import { initials } from '@/utils/format'
import { translateRole } from '@/i18n/helpers'

const { t } = useI18n()
const route = useRoute()
const authStore = useAuthStore()

const isCollapsed = ref(false)

const navItems = computed(() => {
  const items = [
    { name: 'company-dashboard', label: t('nav.company.dashboard'), icon: 'fa-chart-pie' },
    { name: 'company-profile', label: t('nav.company.profile'), icon: 'fa-building' },
    { name: 'company-policies', label: t('nav.company.policies'), icon: 'fa-sliders' },
    { name: 'company-requests', label: t('nav.company.requests'), icon: 'fa-envelope-open-text' },
    { name: 'company-staff-management', label: t('nav.company.staff'), icon: 'fa-users-gear' },
    { name: 'company-employee-profiles', label: t('nav.company.employeeProfiles'), icon: 'fa-address-card' },
    { name: 'company-evaluations', label: t('nav.company.evaluations'), icon: 'fa-award' },
    { name: 'company-attendance', label: t('nav.company.attendance'), icon: 'fa-clipboard-user' },
    { name: 'company-payroll', label: t('nav.company.payroll'), icon: 'fa-money-check-dollar' },
    { name: 'company-settings', label: t('nav.company.settings'), icon: 'fa-gear' }
  ]

  return items.filter((item) => {
    if (!authStore.canAccessCompanyRoute(item.name)) return false
    if (item.name === 'company-policies') return authStore.canViewPolicies
    if (item.name === 'company-profile') return authStore.isGeneralManager
    if (item.name === 'company-employee-profiles') return authStore.isGeneralManager || authStore.isHrManager
    if (item.name === 'company-evaluations') return authStore.isHr
    if (item.name === 'company-requests') return authStore.canViewRequestDetails
    return true
  })
})

const roleLabel = computed(() => translateRole(authStore.userRole))
const adminName = computed(() => authStore.user?.name || authStore.user?.contact_name || roleLabel.value)
const adminEmail = computed(() => authStore.user?.email || authStore.company?.email || t('common.emDash'))
const adminInitials = computed(() => initials(adminName.value) || initials(roleLabel.value))

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
}

async function handleLogout() {
  await authStore.logout()
}
</script>

<template>
  <aside
    class="gradient-brand text-white flex flex-col flex-shrink-0 border-e border-khubrat-goldDark/20 z-20 transition-all duration-300 relative"
    :class="isCollapsed ? 'w-20' : 'w-72'"
  >
    <button
      @click="toggleSidebar"
      class="absolute -end-3 top-7 bg-khubrat-goldDark text-white w-6 h-6 rounded-full flex items-center justify-center border border-white/20 hover:bg-khubrat-goldLight transition-colors z-30"
      :title="isCollapsed ? $t('nav.expandSidebar') : $t('nav.collapseSidebar')"
    >
      <i class="fa-solid fa-xs rtl:rotate-180" :class="isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
    </button>

    <div class="p-6 border-b border-white/10 flex items-center justify-center w-full overflow-hidden h-24">
      <AppLogo
        variant="sidebar"
        :size="isCollapsed ? 'sm' : 'md'"
        :showText="!isCollapsed"
      />
    </div>

    <nav class="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
      <router-link
        v-for="item in navItems"
        :key="item.name"
        :to="{ name: item.name }"
        class="tab-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200"
        :class="[
          route.name === item.name
            ? 'bg-khubrat-goldLight/10 text-khubrat-goldLight border-s-4 border-khubrat-goldLight'
            : 'text-white/70 hover:bg-white/5 hover:text-white',
          isCollapsed ? 'justify-center px-0' : 'text-start'
        ]"
        :title="isCollapsed ? item.label : ''"
      >
        <i class="fa-solid text-lg flex-shrink-0" :class="item.icon"></i>
        <span v-show="!isCollapsed" class="font-semibold text-sm whitespace-nowrap">{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="p-4 border-t border-white/10 bg-black/20">
      <div class="flex items-center" :class="isCollapsed ? 'justify-center' : 'gap-3'">
        <div
          class="w-10 h-10 rounded-full flex-shrink-0 bg-khubrat-goldDark flex items-center justify-center text-white font-bold text-sm"
          :title="`${adminName} — ${roleLabel}`"
        >
          {{ adminInitials }}
        </div>

        <template v-if="!isCollapsed">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-khubrat-goldLight truncate">{{ adminName }}</p>
            <p class="text-[11px] text-white/50 truncate">{{ adminEmail }}</p>
          </div>
          <button
            class="ms-auto text-white/40 hover:text-red-400 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
            :title="$t('nav.logout')"
            :disabled="authStore.loggingOut"
            @click="handleLogout"
          >
            <i class="fa-solid" :class="authStore.loggingOut ? 'fa-spinner fa-spin' : 'fa-right-from-bracket rtl:-scale-x-100'"></i>
          </button>
        </template>

        <button
          v-else
          class="absolute bottom-16 text-white/40 hover:text-red-400 p-2 bg-black/40 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          :title="$t('nav.logout')"
          :disabled="authStore.loggingOut"
          @click="handleLogout"
        >
          <i class="fa-solid" :class="authStore.loggingOut ? 'fa-spinner fa-spin' : 'fa-right-from-bracket rtl:-scale-x-100'"></i>
        </button>
      </div>
    </div>
  </aside>
</template>

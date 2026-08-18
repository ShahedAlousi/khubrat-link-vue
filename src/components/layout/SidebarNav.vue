<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLogo from '@/components/common/AppLogo.vue'
import { useAuthStore } from '@/stores/auth.store'
import { initials } from '@/utils/format'

const { t } = useI18n()
const route = useRoute()
const authStore = useAuthStore()

const isCollapsed = ref(false)

const navItems = computed(() => [
  { name: 'dashboard-overview', label: t('nav.admin.overview'), icon: 'fa-chart-pie' },
  { name: 'dashboard-packages', label: t('nav.admin.packages'), icon: 'fa-cubes' },
  { name: 'dashboard-companies', label: t('nav.admin.companies'), icon: 'fa-building' },
  { name: 'dashboard-settings', label: t('nav.admin.settings'), icon: 'fa-sliders' }
])

const adminName = computed(() => authStore.user?.name || authStore.user?.contact_name || t('nav.administrator'))
const adminEmail = computed(() => authStore.user?.email || t('common.emDash'))
const adminInitials = computed(() => initials(adminName.value) || 'AD')

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
        <div class="w-10 h-10 rounded-full flex-shrink-0 bg-khubrat-goldDark flex items-center justify-center text-white font-bold text-sm">
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

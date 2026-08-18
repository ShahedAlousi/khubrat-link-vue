<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import StaffDirectoryTab from '@/components/staff/StaffDirectoryTab.vue'
import DepartmentsTab from '@/components/staff/DepartmentsTab.vue'
import BulkImportTab from '@/components/staff/BulkImportTab.vue'

const { t } = useI18n()
const authStore = useAuthStore()
const activeTab = ref('directory')

const tabs = computed(() => {
  if (authStore.isDepartmentManager) {
    return [{ id: 'directory', label: t('staff.employees'), icon: 'fa-address-book' }]
  }

  const items = [
    { id: 'directory', label: t('staff.employeesHr'), icon: 'fa-address-book' },
    { id: 'departments', label: t('staff.departments'), icon: 'fa-sitemap' }
  ]

  if (authStore.isHrManager) {
    items.push({ id: 'import', label: t('staff.bulkImport'), icon: 'fa-file-arrow-up' })
  }

  return items
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
        :class="
          activeTab === tab.id
            ? 'bg-khubrat-blue text-khubrat-goldLight dark:bg-khubrat-goldLight dark:text-khubrat-blue shadow-sm'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
        "
        @click="activeTab = tab.id"
      >
        <i class="fa-solid" :class="tab.icon"></i>
        {{ tab.label }}
      </button>
    </div>

    <div v-show="activeTab === 'directory'">
      <StaffDirectoryTab />
    </div>
    <div v-if="!authStore.isDepartmentManager" v-show="activeTab === 'departments'">
      <DepartmentsTab />
    </div>
    <div v-if="authStore.isHrManager" v-show="activeTab === 'import'">
      <BulkImportTab />
    </div>
  </div>
</template>

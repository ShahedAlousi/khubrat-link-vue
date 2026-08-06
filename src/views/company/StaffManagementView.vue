<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import StaffDirectoryTab from '@/components/staff/StaffDirectoryTab.vue'
import DepartmentsTab from '@/components/staff/DepartmentsTab.vue'
import BulkImportTab from '@/components/staff/BulkImportTab.vue'

const authStore = useAuthStore()
const activeTab = ref('directory')

const tabs = computed(() => {
  const items = [
    { id: 'directory', label: 'Employees & HR', icon: 'fa-address-book' },
    { id: 'departments', label: 'Departments', icon: 'fa-sitemap' }
  ]

  if (authStore.isHrManager) {
    items.push({ id: 'import', label: 'Bulk Import', icon: 'fa-file-arrow-up' })
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
    <div v-show="activeTab === 'departments'">
      <DepartmentsTab />
    </div>
    <div v-if="authStore.isHrManager" v-show="activeTab === 'import'">
      <BulkImportTab />
    </div>
  </div>
</template>

<script setup>
/**
 * StaffManagementView.vue
 */
import { ref } from 'vue'
import StaffDirectoryPanel from '@/components/staff/StaffDirectoryPanel.vue'
import AddHrManagerPanel from '@/components/staff/AddHrManagerPanel.vue'
import BulkImportPanel from '@/components/staff/BulkImportPanel.vue'

const TABS = [
  { id: 'directory', label: 'Staff & Managers Directory', icon: 'fa-address-book' },
  { id: 'add-hr', label: 'Add HR Manager', icon: 'fa-user-shield' },
  { id: 'import', label: 'Bulk Import via Excel', icon: 'fa-file-arrow-up' }
]

const activeTab = ref('add-hr') // التبويب الوحيد المفعّل حاليًا يُفتح افتراضيًا
</script>

<template>
  <div class="space-y-6">
    <!-- التبويبات الرئيسية -->
    <div class="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        class="px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
        :class="activeTab === tab.id
          ? 'bg-khubrat-blue text-khubrat-goldLight dark:bg-khubrat-goldLight dark:text-khubrat-blue shadow-sm'
          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'"
        @click="activeTab = tab.id"
      >
        <i class="fa-solid" :class="tab.icon"></i>
        {{ tab.label }}
      </button>
    </div>

    <!-- محتوى التبويبات (v-show للحفاظ على حالة كل تبويب) -->
    <div v-show="activeTab === 'directory'">
      <StaffDirectoryPanel />
    </div>
    <div v-show="activeTab === 'add-hr'">
      <AddHrManagerPanel />
    </div>
    <div v-show="activeTab === 'import'">
      <BulkImportPanel />
    </div>
  </div>
</template>

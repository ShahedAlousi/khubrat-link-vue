<script setup>
import SidebarNav from './SidebarNav.vue'
import DashboardHeader from './DashboardHeader.vue'
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
    <SidebarNav />

    <main class="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <DashboardHeader />

      <div class="flex-1 overflow-y-auto p-8">
        <router-view />
      </div>
    </main>
  </div>
</template>

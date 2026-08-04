<!-- AttendanceTrackerView.vue -->

<script setup>
import { ref, onMounted } from 'vue'
import AttendanceStatsOverview from '@/components/attendance/AttendanceStatsOverview.vue'
import AttendanceLogTable from '@/components/attendance/AttendanceLogTable.vue'
import AttendanceQrKiosk from '@/components/attendance/AttendanceQrKiosk.vue' 
import { useDepartmentsStore } from '@/stores/department.store'
// TODO: استبدلي هذا بالمصدر الفعلي لقائمة الأقسام (نفس ميزة Staff Management)
const departments = ref([])
const showQrKiosk = ref(false)

onMounted(async () => {
  const departmentStore = useDepartmentsStore()
    await departmentStore.fetchDepartments()
    departments.value = departmentStore.departments
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- جديد: شريط عنوان + زر واضح لإظهار الـ QR -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-black text-khubrat-blue dark:text-khubrat-goldLight">Attendance Tracker</h2>
        <p class="text-xs text-slate-400">Daily presence overview and clock-in QR management.</p>
      </div>
      <button
        type="button"
        class="px-5 py-2.5 bg-khubrat-blue dark:bg-khubrat-goldLight text-white dark:text-khubrat-blue font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm hover:opacity-90 transition-all hover:scale-105 active:scale-95"
        @click="showQrKiosk = true"
      >
        <i class="fa-solid fa-qrcode text-sm"></i>
        Show Attendance QR Code
      </button>
    </div>    
    <AttendanceStatsOverview />
    <AttendanceLogTable :departments="departments" />

        <!--: شاشة Kiosk بملء الصفحة -->
    <AttendanceQrKiosk v-if="showQrKiosk" @close="showQrKiosk = false" />

  </div>
</template>

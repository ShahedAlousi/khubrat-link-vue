<script setup>
/**
 * Company analytics dashboard shell.
 * Each analytics domain is a self-contained section component so new
 * domains (attendance, leave, evaluations, …) can be added below without
 * restructuring the page.
 */
import PayrollAnalyticsSection from '@/components/company-dashboard/PayrollAnalyticsSection.vue'
import HeadcountAnalyticsSection from '@/components/company-dashboard/HeadcountAnalyticsSection.vue'
</script>

<template>
  <div class="space-y-10 max-w-[1400px] mx-auto">
    <!-- <header>
      <h1 class="text-xl font-black text-khubrat-blue dark:text-white">
        Company Dashboard
      </h1>
      <p class="text-xs text-slate-400 mt-1">
        Operational analytics across payroll, workforce, and other company modules.
      </p>
    </header> -->

    <!-- Headcount & Workforce analytics domain -->
    <HeadcountAnalyticsSection />

    <!-- Payroll analytics domain -->
    <PayrollAnalyticsSection />

    <!--
      Future analytics sections (examples):
      <AttendanceAnalyticsSection />
      <LeaveAnalyticsSection />
      <EvaluationsAnalyticsSection />
    -->
  </div>
</template>
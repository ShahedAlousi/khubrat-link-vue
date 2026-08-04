<!--
  AttendanceStatsOverview.vue
  ============================================================================-->
<script setup>
import { computed } from 'vue'
import { useAttendanceStore } from '@/stores/attendance.store'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const store = useAttendanceStore()

/**
 * تعريف بطاقات الـ KPI الخمس بشكل معلن (declarative array) بدلاً من تكرار
 * نفس قالب الـ template خمس مرات يدوياً.
 */
const kpiCards = computed(() => {
  const s = store.stats
  const total = s.totalRecords || 0
  const percentOf = (n) => (total ? Math.round((n / total) * 100) : 0)

  return [
    { key: 'present', label: 'Present Today', value: s.present, percent: percentOf(s.present), icon: 'fa-house-laptop', color: 'emerald' },
    { key: 'late', label: 'Late Arrivals', value: s.late, percent: percentOf(s.late), icon: 'fa-business-time', color: 'amber' },
    { key: 'earlyLeave', label: 'Early Leaves', value: s.earlyLeave, percent: percentOf(s.earlyLeave), icon: 'fa-door-open', color: 'indigo' },
    { key: 'absent', label: 'Absences', value: s.absent, percent: percentOf(s.absent), icon: 'fa-user-slash', color: 'rose' },
    { key: 'offDay', label: 'Day Off', value: s.offDay, percent: percentOf(s.offDay), icon: 'fa-calendar-day', color: 'slate' },
  ]
})

// خرائط ألوان Tailwind ثابتة ومكتوبة بالكامل (classes كاملة وليست مُركَّبة
// ديناميكياً بالـ template) حتى لا يحذفها Tailwind JIT عند البناء (purge)
const colorClasses = {
  emerald: 'bg-emerald-500/10 text-emerald-500',
  amber: 'bg-amber-500/10 text-amber-500',
  indigo: 'bg-indigo-500/10 text-indigo-500',
  rose: 'bg-rose-500/10 text-rose-500',
  slate: 'bg-slate-500/10 text-slate-500',
}
</script>

<template>
  <section class="space-y-6">
    <!-- صف بطاقات KPI (خمس بطاقات تطابق فئات stats القادمة من الباك اند) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div
        v-for="card in kpiCards"
        :key="card.key"
        class="group relative bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-khubrat-goldLight/30"
      >
        <div :class="['p-3 rounded-xl shrink-0', colorClasses[card.color]]">
          <i :class="['fa-solid text-xl', card.icon]"></i>
        </div>
        <div class="flex-1 min-w-0">
          <span class="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block truncate">{{ card.label }}</span>
          <h3 class="text-2xl font-black text-slate-800 dark:text-white">{{ card.value }}</h3>
          <p class="text-[9px] text-slate-400 mt-0.5">{{ card.percent }}% of {{ store.stats.totalRecords }} total records</p>
        </div>
      </div>
    </div>

    <!-- مخطط التزام التوثيق (Donut) -- منقول 1:1 من التصميم الأصلي شكلياً،
         لكن مصدر بياناته الآن هو complianceBreakdown المحسوب بالـ store -->
    <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6">
      <div class="space-y-2 flex-1 text-left">
        <h4 class="text-xs font-black text-khubrat-blue dark:text-khubrat-goldLight uppercase tracking-wider">Stamp Verification Compliance</h4>
        <p class="text-[10px] text-slate-400 leading-relaxed">
          Biometric/QR stamps vs. manual admin overrides — calculated from the attendance records currently loaded.
        </p>
        <div class="space-y-1.5 pt-2 text-[10px] font-bold">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-indigo-500 dark:bg-khubrat-goldLight rounded-full"></span>
            <span class="text-slate-700 dark:text-slate-300">QR Stamp ({{ store.complianceBreakdown.digital }} Records)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
            <span class="text-slate-700 dark:text-slate-300">Manual Override ({{ store.complianceBreakdown.manual }} Records)</span>
          </div>
        </div>
      </div>

      <div class="relative w-28 h-28 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" stroke-width="3" class="dark:stroke-slate-700" />
          <circle
            cx="18" cy="18" r="15.915" fill="none" stroke="#6366f1" stroke-width="3.5"
            class="transition-all duration-500 dark:stroke-[#FCD88A]"
            :stroke-dasharray="`${store.complianceBreakdown.digitalPercent} 100`"
            stroke-dashoffset="0"
          />
          <circle
            cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" stroke-width="3.5"
            class="transition-all duration-500"
            :stroke-dasharray="`${store.complianceBreakdown.manualPercent} 100`"
            :stroke-dashoffset="`-${store.complianceBreakdown.digitalPercent}`"
          />
        </svg>
        <div class="absolute text-center">
          <span class="text-xs font-black block text-slate-800 dark:text-white">{{ store.complianceBreakdown.digitalPercent }}%</span>
          <span class="text-[7px] text-slate-400 font-semibold block uppercase">Compliance</span>
        </div>
      </div>
    </div>

    <div v-if="store.loadingStats" class="flex justify-center py-2">
      <LoadingSpinner />
    </div>
  </section>
</template>

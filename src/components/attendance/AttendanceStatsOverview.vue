<!--
  AttendanceStatsOverview.vue
  ============================================================================-->
  <script setup>
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useAttendanceStore } from '@/stores/attendance.store'
  import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
  
  const store = useAttendanceStore()
  const { t } = useI18n()
  
  /**
   * تعريف بطاقات الـ KPI بشكل معلن (declarative array) بدلاً من تكرار نفس قالب
   * الـ template عدة مرات يدوياً.
   * ✅ النسبة المئوية الآن محسوبة من إجمالي الموظفين النشطين (totalEmployees)
   * وليس totalRecords، لأن الأخير يعني تحديداً "عدد من عنده صف
   * attendance_records محفوظ فعلياً" وهذا لا يشمل not_arrived / on_leave، فكانت
   * تُنتج نسباً مضلِّلة (أكبر من 100% أحياناً).
   * ✅ أُضيفت بطاقتا "Not Arrived" و "On Leave" لأن /stats الفعلي يُرجعهما الآن.
   */
  const kpiCards = computed(() => {
    const s = store.stats
    const total = s.totalEmployees || 0
    const percentOf = (n) => (total ? Math.round((n / total) * 100) : 0)
  
    return [
      { key: 'present', label: t('attendance.presentToday'), value: s.present, percent: percentOf(s.present), icon: 'fa-house-laptop', color: 'emerald' },
      { key: 'late', label: t('attendance.lateArrivals'), value: s.late, percent: percentOf(s.late), icon: 'fa-business-time', color: 'amber' },
      { key: 'earlyLeave', label: t('attendance.earlyLeaves'), value: s.earlyLeave, percent: percentOf(s.earlyLeave), icon: 'fa-door-open', color: 'indigo' },
      { key: 'absent', label: t('attendance.absences'), value: s.absent, percent: percentOf(s.absent), icon: 'fa-user-slash', color: 'rose' },
      { key: 'notArrived', label: t('attendance.notArrived'), value: s.notArrived, percent: percentOf(s.notArrived), icon: 'fa-user-clock', color: 'sky' },
      { key: 'onLeave', label: t('attendance.onLeave'), value: s.onLeave, percent: percentOf(s.onLeave), icon: 'fa-plane-departure', color: 'fuchsia' },
      { key: 'offDay', label: t('attendance.dayOff'), value: s.offDay, percent: percentOf(s.offDay), icon: 'fa-calendar-day', color: 'slate' },
    ]
  })
  
  // خرائط ألوان Tailwind ثابتة ومكتوبة بالكامل (classes كاملة وليست مُركَّبة
  // ديناميكياً بالـ template) حتى لا يحذفها Tailwind JIT عند البناء (purge)
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-500',
    amber: 'bg-amber-500/10 text-amber-500',
    indigo: 'bg-indigo-500/10 text-indigo-500',
    rose: 'bg-rose-500/10 text-rose-500',
    sky: 'bg-sky-500/10 text-sky-500',
    fuchsia: 'bg-fuchsia-500/10 text-fuchsia-500',
    slate: 'bg-slate-500/10 text-slate-500',
  }

  const donutSegments = computed(() => {
    const d = store.statusDistribution
    const defs = [
      { key: 'present', label: t('attendance.present'), count: d.present, percent: d.presentPercent, color: '#10b981', dot: 'bg-emerald-500' },
      { key: 'late', label: t('attendance.late'), count: d.late, percent: d.latePercent, color: '#f59e0b', dot: 'bg-amber-500' },
      { key: 'earlyLeave', label: t('attendance.earlyLeave'), count: d.earlyLeave, percent: d.earlyLeavePercent, color: '#6366f1', dot: 'bg-indigo-500' },
      { key: 'absent', label: t('attendance.absent'), count: d.absent, percent: d.absentPercent, color: '#f43f5e', dot: 'bg-rose-500' },
      { key: 'notArrived', label: t('attendance.notArrived'), count: d.notArrived, percent: d.notArrivedPercent, color: '#0ea5e9', dot: 'bg-sky-500' },
      { key: 'onLeave', label: t('attendance.onLeave'), count: d.onLeave, percent: d.onLeavePercent, color: '#d946ef', dot: 'bg-fuchsia-500' },
    ]
    let offset = 0
    return defs.map((seg) => {
      const withOffset = { ...seg, offset }
      offset += seg.percent
      return withOffset
    })
  })
  </script>
  
  <template>
    <section class="space-y-6">
      <!-- صف بطاقات KPI (تطابق الآن كل فئات display_status القادمة من /stats) -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
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
            <p class="text-[9px] text-slate-400 mt-0.5">{{ $t('attendance.pctOf', { pct: card.percent, n: store.stats.totalEmployees }) }}</p>
          </div>
        </div>
      </div>
  
      <!-- مخطط توزيع حالات الحضور (Donut) -- مبني الآن على statusDistribution
           (بيانات حقيقية من /stats)، بدلاً من "Stamp Verification Compliance"
           الوهمي سابقاً -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6">
        <div class="space-y-2 flex-1 text-start">
          <h4 class="text-xs font-black text-khubrat-blue dark:text-khubrat-goldLight uppercase tracking-wider">{{ $t('attendance.breakdown') }}</h4>
          <p class="text-[10px] text-slate-400 leading-relaxed">
            {{ $t('attendance.breakdownHint') }}
          </p>
          <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2 text-[10px] font-bold">
            <div v-for="seg in donutSegments" :key="seg.key" class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="seg.dot"></span>
              <span class="text-slate-700 dark:text-slate-300 truncate">{{ seg.label }} ({{ seg.count }})</span>
            </div>
          </div>
        </div>
  
        <div class="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" stroke-width="3" class="dark:stroke-slate-700" />
            <circle
              v-for="seg in donutSegments"
              :key="seg.key"
              cx="18" cy="18" r="15.915" fill="none"
              :stroke="seg.color"
              stroke-width="3.5"
              class="transition-all duration-500"
              :stroke-dasharray="`${seg.percent} 100`"
              :stroke-dashoffset="`-${seg.offset}`"
            />
          </svg>
          <div class="absolute text-center">
            <span class="text-xs font-black block text-slate-800 dark:text-white">{{ store.statusDistribution.presentPercent }}%</span>
            <span class="text-[7px] text-slate-400 font-semibold block uppercase">{{ $t('attendance.present') }}</span>
          </div>
        </div>
      </div>
  
      <div v-if="store.loadingStats" class="flex justify-center py-2">
        <LoadingSpinner />
      </div>
    </section>
  </template>
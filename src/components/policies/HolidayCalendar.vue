<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  holidays: { type: Array, default: () => [] }, // { name, start_date, end_date, repeats_annually }
  weeklyRestDays: { type: Array, default: () => [] }, // e.g. ["friday", "saturday"]
  readonly: { type: Boolean, default: false }
})

// يُبعث مع نطاق التاريخ المحدد (يوم واحد أو عدة أيام عبر السحب)
const { t, tm } = useI18n()
const emit = defineEmits(['select-range'])

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const weekdayShort = computed(() => {
  const labels = tm('weekdays.short')
  return Array.isArray(labels) ? labels : DAY_NAMES.map((_, i) => t(`weekdays.short[${i}]`))
})

const monthNames = computed(() => {
  const labels = tm('months.long')
  return Array.isArray(labels) ? labels : Array.from({ length: 12 }, (_, i) => t(`months.long[${i}]`))
})

const currentMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

// نص عنوان الشهر/السنة الحالي المعروض أعلى التقويم
const monthLabel = computed(() => `${monthNames.value[currentMonth.value.getMonth()]} ${currentMonth.value.getFullYear()}`)

// ينتقل شهرًا للأمام أو للخلف حسب الاتجاه الممرَّر (-1 / 1)
function navigateMonth(direction) {
  const next = new Date(currentMonth.value)
  next.setMonth(next.getMonth() + direction)
  currentMonth.value = next
}

// يستخرج جزء "YYYY-MM-DD" فقط من أي قيمة تاريخ قادمة من الـ API — الباك اند
// غالبًا يُعيد التاريخ كطابع زمني كامل (مثل "2026-03-08T00:00:00.000000Z")
// وليس كنص تاريخ مجرّد، فدمجه مباشرة مع "T00:00:00" كان يُنتج تاريخًا فاسدًا
// (Invalid Date) يمنع أي تطابق — وهذا كان سبب اختفاء ألوان العطل تمامًا.
function toDateOnly(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function isRecurring(value) {
  return value === true || value === 1 || value === '1' || value === 'true'
}

// يبحث عن العطلة التي يقع ضمن مداها التاريخ الممرَّر، إن وجدت.
// العطلة السنوية تُطابق بالشهر واليوم فقط حتى تظهر في كل سنة معروضة،
// وليس فقط في السنة التي حُفظت بها أول مرة.
function findHoliday(dateStr) {
  const target = new Date(`${dateStr}T00:00:00`)
  return props.holidays.find((h) => {
    const startDate = toDateOnly(h.start_date)
    const endDate = toDateOnly(h.end_date) || startDate
    if (!startDate) return false

    if (isRecurring(h.repeats_annually)) {
      const targetMonthDay = dateStr.slice(5)
      const startMonthDay = startDate.slice(5)
      const endMonthDay = endDate.slice(5)

      // يدعم أيضًا نطاقًا سنويًا يعبر نهاية السنة، مثل 31-12 إلى 01-01.
      return startMonthDay <= endMonthDay
        ? targetMonthDay >= startMonthDay && targetMonthDay <= endMonthDay
        : targetMonthDay >= startMonthDay || targetMonthDay <= endMonthDay
    }

    const start = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T00:00:00`)
    return target >= start && target <= end
  })
}

// يبني مصفوفة خلايا الشهر الحالي (فراغات قبل اليوم الأول + كل أيام الشهر)
const weeks = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const firstDayIndex = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstDayIndex; i++) cells.push(null)

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayOfWeek = new Date(year, month, day).getDay()
    const isRestDay = props.weeklyRestDays.includes(DAY_NAMES[dayOfWeek])
    const holiday = findHoliday(dateStr)
    cells.push({ day, dateStr, isRestDay, holiday })
  }

  return cells
})

// يبني نص الـ tooltip عند تمرير الفأرة: اسم العطلة + تنبيه لو صادف يوم الراحة الأسبوعية أيضًا
function cellTooltip(cell) {
  if (!cell) return ''
  if (cell.holiday && cell.isRestDay) {
    return t('policies.restDayAlso', { name: cell.holiday.name })
  }
  if (cell.holiday) return cell.holiday.name
  if (cell.isRestDay) return t('policies.restDayTooltip')
  return ''
}

// --- منطق الضغط والسحب لتحديد نطاق من الأيام ---
const isDragging = ref(false)
const dragStart = ref(null)
const dragEnd = ref(null)

// حدود التحديد الحالي مرتّبة (الأصغر ثم الأكبر) بغض النظر عن اتجاه السحب
const selectionRange = computed(() => {
  if (!dragStart.value || !dragEnd.value) return null
  return dragStart.value <= dragEnd.value
    ? { start: dragStart.value, end: dragEnd.value }
    : { start: dragEnd.value, end: dragStart.value }
})

// يتحقق إن كان تاريخ خلية معيّنة واقعًا ضمن نطاق السحب الحالي (للتظليل الحي)
function isInSelection(dateStr) {
  if (!isDragging.value || !selectionRange.value) return false
  return dateStr >= selectionRange.value.start && dateStr <= selectionRange.value.end
}

// يبدأ التحديد عند الضغط على خلية (يعمل أيضًا كنقرة عادية ليوم واحد)
function startDrag(cell) {
  if (props.readonly || !cell) return
  isDragging.value = true
  dragStart.value = cell.dateStr
  dragEnd.value = cell.dateStr
}

// يوسّع نطاق التحديد أثناء تمرير المؤشر فوق خلية جديدة والسحب مستمر
function extendDrag(cell) {
  if (props.readonly || !cell || !isDragging.value) return
  dragEnd.value = cell.dateStr
}

// ينهي عملية السحب ويبعث نطاق التاريخ النهائي (يوم واحد أو عدة أيام) للأب
function finishDrag() {
  if (!isDragging.value || !selectionRange.value) {
    isDragging.value = false
    return
  }
  emit('select-range', { startDate: selectionRange.value.start, endDate: selectionRange.value.end })
  isDragging.value = false
  dragStart.value = null
  dragEnd.value = null
}

// يلتقط رفع زر الفأرة حتى خارج التقويم (مثلاً لو انزلق المؤشر خارج الخلايا)
onMounted(() => window.addEventListener('mouseup', finishDrag))
onBeforeUnmount(() => window.removeEventListener('mouseup', finishDrag))
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
      <div class="flex items-center gap-2">
        <button
          class="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs"
          @click="navigateMonth(-1)"
        >
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <span class="text-sm font-extrabold text-khubrat-blue dark:text-white min-w-[110px] text-center">{{ monthLabel }}</span>
        <button
          class="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs"
          @click="navigateMonth(1)"
        >
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
      <div class="flex gap-4 text-[10px] font-bold">
        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500"></span> {{ $t('policies.weeklyRestLegend') }}</div>
        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-600"></span> {{ $t('policies.repeatsAnnually') }}</div>
        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-600"></span> {{ $t('policies.oneOff') }}</div>
      </div>
    </div>

    <!-- select-none يمنع تظليل النص الافتراضي للمتصفح أثناء السحب فوق الشبكة -->
    <div class="p-4 rounded-2xl border-2 border-solid border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 shadow-inner select-none">
      <div class="grid grid-cols-7 gap-1 text-center text-[11px] font-black text-slate-900 dark:text-slate-100 tracking-wider mb-2">
        <div v-for="(day, index) in weekdayShort" :key="index">{{ day }}</div>
      </div>
      <div class="grid grid-cols-7 gap-1">
        <div
          v-for="(cell, index) in weeks"
          :key="index"
          class="h-16 rounded-lg p-1.5 flex flex-col justify-between text-[9px] transition-all"
          :class="[
            !cell ? 'bg-slate-100/40 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800 pointer-events-none' : readonly ? 'border text-slate-900 dark:text-slate-100' : 'cursor-pointer hover:shadow-md border text-slate-900 dark:text-slate-100',
            cell && !cell.holiday && cell.isRestDay ? 'bg-slate-300/60 dark:bg-slate-600/50 border-slate-400 dark:border-slate-500' : '',
            cell && !cell.holiday && !cell.isRestDay ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600' : '',
            cell && cell.holiday && isRecurring(cell.holiday.repeats_annually) ? 'bg-emerald-600/15 border-emerald-600 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400' : '',
            cell && cell.holiday && !isRecurring(cell.holiday.repeats_annually) ? 'bg-blue-600/15 border-blue-600 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400' : '',
            cell && isInSelection(cell.dateStr) ? '!bg-khubrat-goldLight/40 !border-khubrat-goldDark ring-2 ring-khubrat-goldDark/50' : ''
          ]"
          :title="cellTooltip(cell)"
          @mousedown.prevent="startDrag(cell)"
          @mouseenter="extendDrag(cell)"
        >
          <template v-if="cell">
            <div class="flex items-center justify-between">
              <span class="text-[12px] font-black">{{ cell.day }}</span>
              <span
                v-if="cell.holiday"
                class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                :class="isRecurring(cell.holiday.repeats_annually) ? 'bg-emerald-600' : 'bg-blue-600'"
              ></span>
            </div>
            <!-- line-clamp-2 يسمح بعرض سطرين من اسم العطلة داخل المربع الصغير بدل قصّه بسطر واحد فقط -->
            <span v-if="cell.holiday" class="text-[8px] font-black leading-tight line-clamp-2">{{ cell.holiday.name }}</span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
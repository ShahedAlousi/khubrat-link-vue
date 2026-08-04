<!--
  ClockTimePickerModal.vue
  ===========================================================================-->
<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  initialValue: {
    type: Object,
    default: () => ({ hours: 9, minutes: 0, period: 'AM' }),
  },
})
const emit = defineEmits(['confirm', 'close'])

const phase = ref('hours') // 'hours' | 'minutes'
const hours = ref(9)
const minutes = ref(0)
const period = ref('AM')

// عند فتح المودال، نُعبّئ الحالة الداخلية من القيمة الأولية القادمة من الأب
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      hours.value = props.initialValue?.hours ?? 9
      minutes.value = props.initialValue?.minutes ?? 0
      period.value = props.initialValue?.period ?? 'AM'
      phase.value = 'hours'
    }
  }
)

/** إحداثيات أرقام الساعات حول محيط الساعة (مركز 96,96 ونصف قطر 70 بمساحة رسم 192×192) */
const hourMarks = computed(() =>
  Array.from({ length: 12 }, (_, i) => {
    const h = i + 1
    const angle = (h * 30 * Math.PI) / 180
    return { value: h, x: 96 + 70 * Math.sin(angle), y: 96 - 70 * Math.cos(angle) }
  })
)
/** إحداثيات أرقام الدقائق (12 علامة بخطوات 5 دقائق: 00, 05, 10 ... 55) */
const minuteMarks = computed(() =>
  Array.from({ length: 12 }, (_, i) => {
    const m = i * 5
    const angle = (i * 30 * Math.PI) / 180
    return { value: m, x: 96 + 70 * Math.sin(angle), y: 96 - 70 * Math.cos(angle) }
  })
)

/** زاوية دوران عقرب الساعة حسب المرحلة الحالية (اختيار ساعة أو دقيقة) */
const handRotation = computed(() =>
  phase.value === 'hours' ? hours.value * 30 : (minutes.value / 60) * 360
)

function pickHour(h) {
  hours.value = h
  phase.value = 'minutes' // بعد اختيار الساعة ننتقل تلقائياً لاختيار الدقائق (نفس سلوك الأصل)
}
function pickMinute(m) {
  minutes.value = m
}
function confirm() {
  emit('confirm', { hours: hours.value, minutes: minutes.value, period: period.value })
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <div class="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-xs shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <!-- رأس المودال: يعرض الوقت المُختار حالياً + مفتاح AM/PM -->
      <div class="bg-khubrat-blue text-white p-4 text-center">
        <span class="text-[10px] uppercase font-black tracking-widest text-khubrat-goldLight block">
          {{ phase === 'hours' ? 'Select Hours' : 'Select Minutes' }}
        </span>
        <div class="flex items-center justify-center gap-3 mt-2">
          <span
            class="text-3xl font-black cursor-pointer pb-0.5 border-b-2 transition-colors"
            :class="phase === 'hours' ? 'border-khubrat-goldLight text-khubrat-goldLight' : 'border-transparent text-white/50'"
            @click="phase = 'hours'"
          >{{ String(hours).padStart(2, '0') }}</span>
          <span class="text-3xl font-black">:</span>
          <span
            class="text-3xl font-black cursor-pointer pb-0.5 border-b-2 transition-colors"
            :class="phase === 'minutes' ? 'border-khubrat-goldLight text-khubrat-goldLight' : 'border-transparent text-white/50'"
            @click="phase = 'minutes'"
          >{{ String(minutes).padStart(2, '0') }}</span>

          <div class="flex flex-col gap-1 ml-3">
            <button
              type="button"
              class="px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider transition-all"
              :class="period === 'AM' ? 'bg-khubrat-goldLight text-khubrat-blue' : 'text-slate-400'"
              @click="period = 'AM'"
            >AM</button>
            <button
              type="button"
              class="px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider transition-all"
              :class="period === 'PM' ? 'bg-khubrat-goldLight text-khubrat-blue' : 'text-slate-400'"
              @click="period = 'PM'"
            >PM</button>
          </div>
        </div>
      </div>

      <!-- وجه الساعة التناظرية -->
      <div class="p-6 flex flex-col items-center justify-center">
        <div class="w-48 h-48 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 relative shadow-inner select-none">
          <!-- عقرب الساعة (يدور حسب الساعة/الدقيقة المختارة) -->
          <div
            class="absolute w-1 bg-khubrat-blue dark:bg-khubrat-goldLight h-16 origin-bottom transition-transform duration-200"
            :style="{ bottom: '50%', left: 'calc(50% - 2px)', transform: `rotate(${handRotation}deg)` }"
          >
            <div class="w-3.5 h-3.5 rounded-full bg-khubrat-blue dark:bg-khubrat-goldLight absolute -top-1.5 -left-1 ring-4 ring-khubrat-goldLight/20"></div>
          </div>
          <!-- محور الساعة المركزي -->
          <div class="absolute w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600 top-[calc(50%-5px)] left-[calc(50%-5px)]"></div>

          <!-- أرقام الساعات (1-12) -->
          <template v-if="phase === 'hours'">
            <div
              v-for="mark in hourMarks"
              :key="`h-${mark.value}`"
              class="absolute w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold cursor-pointer transition-all"
              :class="hours === mark.value
                ? 'bg-khubrat-blue text-khubrat-goldLight dark:bg-khubrat-goldLight dark:text-khubrat-blue'
                : 'text-slate-800 dark:text-slate-200 hover:bg-khubrat-goldLight/30'"
              :style="{ left: `${mark.x}px`, top: `${mark.y}px`, transform: 'translate(-50%, -50%)' }"
              @click="pickHour(mark.value)"
            >{{ mark.value }}</div>
          </template>

          <!-- أرقام الدقائق (00, 05, 10 ... 55) -->
          <template v-else>
            <div
              v-for="mark in minuteMarks"
              :key="`m-${mark.value}`"
              class="absolute w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold cursor-pointer transition-all"
              :class="minutes === mark.value
                ? 'bg-khubrat-blue text-khubrat-goldLight dark:bg-khubrat-goldLight dark:text-khubrat-blue'
                : 'text-slate-800 dark:text-slate-200 hover:bg-khubrat-goldLight/30'"
              :style="{ left: `${mark.x}px`, top: `${mark.y}px`, transform: 'translate(-50%, -50%)' }"
              @click="pickMinute(mark.value)"
            >{{ String(mark.value).padStart(2, '0') }}</div>
          </template>
        </div>

        <div class="flex gap-2 w-full mt-6">
          <button
            type="button"
            class="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900"
            @click="emit('close')"
          >Cancel</button>
          <button
            type="button"
            class="flex-1 py-2 bg-khubrat-blue dark:bg-khubrat-goldLight text-white dark:text-khubrat-blue rounded-xl text-xs font-black"
            @click="confirm"
          >OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

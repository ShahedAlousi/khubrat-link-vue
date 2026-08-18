<!--
  AttendanceQrKiosk.vue

  ============================================================================
-->
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAttendanceStore } from '@/stores/attendance.store'
import { currentIntlLocale } from '@/i18n/helpers'

const emit = defineEmits(['close'])
const store = useAttendanceStore()
const { t } = useI18n()

// ------------------------------------------------------------------------
// الساعة الحيّة أعلى الشاشة (AM/PM + التاريخ)
// ------------------------------------------------------------------------
const now = ref(new Date())
let clockTimer = null

const clockTime = computed(() => {
  let h = now.value.getHours()
  const period = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  const mm = String(now.value.getMinutes()).padStart(2, '0')
  const ss = String(now.value.getSeconds()).padStart(2, '0')
  return { label: `${String(h).padStart(2, '0')}:${mm}:${ss}`, period, periodLabel: period === 'PM' ? t('attendance.pm') : t('attendance.am') }
})
const dateLabel = computed(() =>
  now.value.toLocaleDateString(currentIntlLocale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
)

// ------------------------------------------------------------------------
// وضع ملء الشاشة (Fullscreen API الحقيقي)
// ------------------------------------------------------------------------
const kioskRef = ref(null)
const isFullscreen = ref(false)

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await kioskRef.value?.requestFullscreen?.()
  } else {
    await document.exitFullscreen()
  }
}
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// ------------------------------------------------------------------------
// إغلاق الشاشة (زر Back to Dashboard)
// ------------------------------------------------------------------------
function close() {
  if (document.fullscreenElement) document.exitFullscreen()
  emit('close')
}

onMounted(() => {
  clockTimer = setInterval(() => (now.value = new Date()), 1000)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  store.startQrAutoRefresh() // يجلب كوداً فوراً ثم يجدده تلقائياً كل 60 ثانية
})
onUnmounted(() => {
  clearInterval(clockTimer)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  store.stopQrAutoRefresh() // مهم: نوقف التحديث التلقائي عند مغادرة الشاشة
  if (document.fullscreenElement) document.exitFullscreen()
})
</script>

<template>
  <Teleport to="body">
    <div ref="kioskRef" class="fixed inset-0 z-[100] gradient-brand text-white flex flex-col overflow-hidden">
      <!-- الشريط العلوي -->
      <div class="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-2 transition-all"
            @click="close"
          >
            <i class="fa-solid fa-arrow-left"></i> {{ $t('attendance.backDashboard') }}
          </button>
          <button
            type="button"
            class="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            :title="$t('attendance.toggleFullscreen')"
            @click="toggleFullscreen"
          >
            <i class="fa-solid" :class="isFullscreen ? 'fa-compress' : 'fa-expand'"></i>
          </button>
        </div>

        <div class="hidden md:flex items-center gap-4">
          <div class="text-center">
            <div class="flex items-baseline gap-2">
              <span class="text-[10px] font-black text-khubrat-goldLight">{{ clockTime.periodLabel }}</span>
              <span class="text-2xl font-black tracking-wider">{{ clockTime.label }}</span>
            </div>
            <span class="text-[10px] text-white/50">{{ dateLabel }}</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-[10px] font-bold text-emerald-300">{{ $t('attendance.liveConnected') }}</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span class="px-3 py-1.5 rounded-lg bg-khubrat-goldLight/15 border border-khubrat-goldLight/30 text-[10px] font-black text-khubrat-goldLight uppercase tracking-wider">
            {{ $t('attendance.kioskTerminal') }}
          </span>
          <div class="text-end hidden sm:block">
            <h1 class="text-sm font-extrabold text-khubrat-goldLight leading-tight">{{ $t('attendance.kioskBrand') }}</h1>
            <p class="text-[9px] text-white/50">{{ $t('attendance.kioskHint') }}</p>
          </div>
        </div>
      </div>

      <!-- المحتوى الرئيسي -->
      <div class="flex-1 flex items-center justify-center px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl w-full">
          <!-- بطاقة QR -->
          <div class="bg-slate-900/60 border border-khubrat-goldLight/20 rounded-3xl p-8 gold-glow mx-auto w-full max-w-md">
            <div class="flex items-center justify-between mb-6">
              <span class="px-2.5 py-1 rounded-lg bg-white/5 text-[10px] font-bold text-white/60">
                ID: {{ store.qrToken ? store.qrToken.slice(0, 12) : $t('common.emDash') }}
              </span>
              <span class="flex items-center gap-1.5 text-[10px] font-bold text-khubrat-goldLight">
                <i class="fa-solid fa-shield-halved"></i> {{ $t('attendance.secureCode') }}
              </span>
            </div>

            <div class="bg-white rounded-2xl p-4 flex items-center justify-center aspect-square">
              <img
                v-if="store.qrImage"
                :src="store.qrImage"
                :alt="$t('attendance.qrAlt')"
                class="w-full h-full object-contain"
              />
              <i v-else class="fa-solid fa-spinner fa-spin text-slate-300 text-4xl"></i>
            </div>

            <div class="mt-6 space-y-2">
              <div class="flex items-center justify-between text-[10px] font-bold">
                <span class="text-white/50">{{ $t('attendance.expiresIn') }}</span>
                <span class="text-khubrat-goldLight">{{ $t('attendance.seconds', { n: store.qrExpiresIn }) }}</span>
              </div>
              <div class="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-1000 linear"
                  :style="{ width: `${Math.max(0, (store.qrExpiresIn / 60) * 100)}%` }"
                ></div>
              </div>
            </div>
          </div>

          <!-- تعليمات الاستخدام -->
          <div class="text-start space-y-5">
            <span class="inline-block px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-khubrat-goldLight">
              {{ $t('attendance.steps') }}
            </span>
            <h2 class="text-3xl lg:text-4xl font-black leading-tight">
              {{ $t('attendance.stepScan') }}
            </h2>
            <p class="text-sm text-white/60 leading-relaxed max-w-md">
              {{ $t('attendance.stepScanBody') }}
            </p>
            <ul class="space-y-3 text-xs font-semibold text-white/80">
              <li class="flex items-center gap-2">
                <i class="fa-solid fa-circle-check text-emerald-400"></i>
                {{ $t('attendance.stepRegen') }}
              </li>
              <li class="flex items-center gap-2">
                <i class="fa-solid fa-circle-check text-emerald-400"></i>
                {{ $t('attendance.stepGeo') }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
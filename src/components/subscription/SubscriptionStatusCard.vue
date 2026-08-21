<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCompaniesStore } from '@/stores/companies.store'
import { useAuthStore } from '@/stores/auth.store'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { translateStatus } from '@/i18n/helpers'

const companiesStore = useCompaniesStore()
const authStore = useAuthStore()
const { t } = useI18n()

const loadError = ref('')

onMounted(async () => {
  loadError.value = ''
    try {
    await companiesStore.fetchSubscriptionUsage()
  } catch (err) {
    loadError.value = err.message || t('subscription.loadFailed')
  }
})

const period = computed(() => companiesStore.subscriptionUsage?.period ?? {})
const employees = computed(() => companiesStore.subscriptionUsage?.employees ?? {})

const daysRemaining = computed(() => companiesStore.daysRemaining)
const isExpired = computed(() => companiesStore.isSubscriptionExpired)
const isFrozen = computed(() => companiesStore.isCompanyFrozen)
const needsRenewal = computed(() => companiesStore.needsRenewal)

/** لا يوجد تاريخ انتهاء معروف للباقة (days_remaining = null من الباك اند) */
const hasNoPeriod = computed(() => daysRemaining.value === null && !isExpired.value && !isFrozen.value)

const monthsRemaining = computed(() => period.value.months_remaining ?? null)

/** نسبة ما مضى من مدة الاشتراك لرسم شريط التقدّم */
const elapsedPercent = computed(() => {
  const total = period.value.total_days
  const elapsed = period.value.days_elapsed
  if (!total || typeof elapsed !== 'number') return null
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
})

const employeesPercent = computed(() => {
  const percent = employees.value.usage_percent
  if (typeof percent === 'number') return Math.min(100, Math.round(percent))
  return null
})

const statusTone = computed(() => {
  if (isFrozen.value || isExpired.value) return 'danger'
  if (needsRenewal.value) return 'warning'
  return 'safe'
})

const toneClasses = {
  danger: {
    ring: 'border-rose-300 dark:border-rose-900',
    value: 'text-rose-600 dark:text-rose-400',
    bar: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
  },
  warning: {
    ring: 'border-amber-300 dark:border-amber-900',
    value: 'text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
  },
  safe: {
    ring: 'border-slate-200 dark:border-slate-700',
    value: 'text-khubrat-blue dark:text-khubrat-goldLight',
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
  }
}

const statusLabel = computed(() => {
  if (isFrozen.value) return translateStatus('frozen')
  if (isExpired.value) return translateStatus('expired')
  if (needsRenewal.value) return translateStatus('expiring_soon')
  if (hasNoPeriod.value) return translateStatus('no_expiry')
  return translateStatus('active')
})

const headline = computed(() => {
  if (isFrozen.value) return t('subscription.frozen')
  if (isExpired.value) return t('subscription.expired')
  if (daysRemaining.value === 0) return t('subscription.expiresToday')
  if (needsRenewal.value) return t('subscription.daysLeft', { n: daysRemaining.value })
  return ''
})

const renewalMessage = computed(() => {
  if (isFrozen.value) {
    return t('subscription.renewFrozen')
  }
  return t('subscription.renewSoon')
})

/** لون صندوق التجديد: أحمر للتجميد/الانتهاء، كهرماني قبل الانتهاء */
const isCriticalRenewal = computed(() => isFrozen.value || isExpired.value)
</script>

<template>
  <div
    class="bg-white dark:bg-slate-800 p-6 rounded-2xl border shadow-sm space-y-5"
    :class="toneClasses[statusTone].ring"
  >
    <div class="flex items-center justify-between">
      <h4 class="text-md font-bold text-khubrat-blue dark:text-white flex items-center gap-2">
        <i class="fa-solid fa-gem text-khubrat-goldDark dark:text-khubrat-goldLight"></i>
        {{ $t('subscription.status') }}
      </h4>
      <span class="px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wide" :class="toneClasses[statusTone].badge">
        {{ statusLabel }}
      </span>
    </div>

    <div v-if="companiesStore.usageLoading && !companiesStore.subscriptionUsage" class="py-8">
      <LoadingSpinner class="mx-auto" />
    </div>

    <template v-else>
      <p
        v-if="loadError"
        class="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl px-4 py-3"
      >
        {{ loadError }}
      </p>

      <!-- تفاصيل الاستهلاك تُعرض فقط عند نجاح جلب البيانات -->
      <template v-if="!loadError">
        <!-- الأيام المتبقية -->
        <div class="flex items-end justify-between gap-4">
          <div>
            <p class="text-xs text-slate-400 font-semibold">{{ $t('subscription.daysRemaining') }}</p>
            <p class="text-4xl font-black leading-tight" :class="toneClasses[statusTone].value">
              <span v-if="isExpired">0</span>
              <span v-else-if="daysRemaining !== null">{{ daysRemaining }}</span>
              <span v-else>{{ $t('common.emDash') }}</span>
            </p>
          </div>
          <p v-if="monthsRemaining !== null" class="text-xs text-slate-400 font-semibold pb-2">
            {{ $t('subscription.monthsLeft', { n: monthsRemaining }) }}
          </p>
        </div>

        <div v-if="elapsedPercent !== null" class="space-y-1.5">
          <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
            <div class="h-full rounded-full transition-all" :class="toneClasses[statusTone].bar" :style="{ width: `${elapsedPercent}%` }"></div>
          </div>
          <p class="text-[11px] text-slate-400">
            {{ $t('subscription.daysUsed', { elapsed: period.days_elapsed, total: period.total_days }) }}
          </p>
        </div>

        <p v-else-if="hasNoPeriod" class="text-xs text-slate-400">
          {{ $t('subscription.noExpiryHint') }}
        </p>

        <!-- استهلاك الموظفين -->
        <div class="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ $t('subscription.employeesUsed') }}</p>
            <p class="text-sm font-black text-slate-700 dark:text-slate-200">
              {{ employees.used ?? 0 }}<span class="text-slate-400 font-bold"> / {{ employees.max ?? '∞' }}</span>
            </p>
          </div>
          <div v-if="employeesPercent !== null" class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
            <div class="h-full rounded-full bg-khubrat-blue dark:bg-khubrat-goldLight transition-all" :style="{ width: `${employeesPercent}%` }"></div>
          </div>
          <p class="text-[11px] text-slate-400">
            <template v-if="employees.remaining !== null && employees.remaining !== undefined">
              {{ $t('subscription.seatsHint', { used: employees.active ?? 0, available: employees.remaining }) }}
            </template>
            <template v-else>
              {{ $t('common.employeesCount', { n: employees.active ?? 0 }) }}
            </template>
          </p>
        </div>
      </template>

      <!-- دعوة التجديد: تظهر عند التجميد أو تبقّي 5 أيام أو أقل أو بعد الانتهاء -->
      <div
        v-if="needsRenewal"
        class="rounded-xl border p-4 space-y-3"
        :class="isCriticalRenewal
          ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
          : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'"
      >
        <div class="flex items-start gap-2.5">
          <i class="fa-solid fa-triangle-exclamation mt-0.5" :class="isCriticalRenewal ? 'text-rose-500' : 'text-amber-500'"></i>
          <div>
            <p class="text-sm font-black" :class="isCriticalRenewal ? 'text-rose-700 dark:text-rose-400' : 'text-amber-800 dark:text-amber-300'">
              {{ headline }}
            </p>
            <p class="text-xs mt-0.5" :class="isCriticalRenewal ? 'text-rose-600/80 dark:text-rose-400/80' : 'text-amber-700/80 dark:text-amber-300/80'">
              {{ renewalMessage }}
            </p>
          </div>
        </div>

        <router-link
          v-if="authStore.isGeneralManager"
          :to="{ name: 'company-subscription-renew' }"
          class="w-full inline-flex items-center justify-center gap-2 rounded-xl font-black text-sm px-5 py-3.5 bg-gradient-to-r from-[#bd8a39] to-[#e3b76a] text-slate-900 shadow-md hover:brightness-105 active:scale-[0.99] transition-all animate-pulse-slow"
        >
          <i class="fa-solid fa-rotate-right"></i>
          {{ $t('subscription.renewNow') }}
        </router-link>

        <p v-else class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {{ $t('subscription.onlyGm') }}
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* نبضة هادئة للفت الانتباه لزر التجديد دون إزعاج بصري */
@keyframes pulse-slow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(189, 138, 57, 0.45); }
  50% { box-shadow: 0 0 0 10px rgba(189, 138, 57, 0); }
}
.animate-pulse-slow {
  animation: pulse-slow 2.2s ease-in-out infinite;
}
</style>

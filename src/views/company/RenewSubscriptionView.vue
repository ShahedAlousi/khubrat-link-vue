<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useCompaniesStore } from '@/stores/companies.store'
import { useSubscriptionPlansStore } from '@/stores/subscriptionPlans.store'
import { savePendingCheckout } from '@/utils/paymentSession'

const router = useRouter()
const authStore = useAuthStore()
const companiesStore = useCompaniesStore()
const plansStore = useSubscriptionPlansStore()

const selectedPlan = ref(null)
const submitError = ref('')
// يصبح true للباقات المجانية فقط: لا جلسة دفع، الباك اند يرسل بريداً بدلاً منها
const freeRenewalDone = ref(false)
const redirecting = ref(false)

const companyEmail = computed(() => authStore.company?.email || authStore.user?.email || '')
const plans = computed(() => plansStore.plans)

onMounted(async () => {
  // فشل جلب الاستهلاك لا يمنع التجديد (قد يُحجب الـ endpoint للشركة المجمّدة)
  if (!companiesStore.subscriptionUsage) {
    companiesStore.fetchSubscriptionUsage().catch(() => {})
  }
  try {
    await plansStore.fetchPlans()
  } catch (err) {
    submitError.value = err.message
  }
})

function priceLabel(plan) {
  return Number(plan.price) === 0 ? 'Free' : `$${plan.price}`
}

async function handleRenew() {
  if (!selectedPlan.value) return
  submitError.value = ''

  const isPaidPlan = selectedPlan.value.plan_type !== 'free' && Number(selectedPlan.value.price) !== 0
  const checkoutTab = isPaidPlan ? window.open('about:blank', '_blank') : null

  try {
    const { paymentUrl, sessionId } = await companiesStore.renewSubscription(selectedPlan.value.id)

    if (paymentUrl) {
      redirecting.value = true
      savePendingCheckout({
        sessionId,
        email: companyEmail.value,
        context: 'renew'
      })

      if (checkoutTab) {
        checkoutTab.location.href = paymentUrl
        await router.push({
          name: 'payment-success',
          query: sessionId ? { session_id: sessionId } : {}
        })
        return
      }

      window.location.href = paymentUrl
      return
    }

    if (checkoutTab) checkoutTab.close()
    freeRenewalDone.value = true
  } catch (err) {
    if (checkoutTab) checkoutTab.close()
    submitError.value = err.message || 'Failed to start the renewal. Please try again.'
  }
}

/** إنهاء الجلسة الحالية والانتقال لصفحة تسجيل الدخول بعد التجديد المجاني */
async function goToLogin() {
  await authStore.logout()
}
</script>

<template>
  <section class="max-w-4xl mx-auto space-y-6">
    <!-- شاشة نجاح التجديد المجاني -->
    <div
      v-if="freeRenewalDone"
      class="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center space-y-5"
    >
      <div class="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 rounded-full flex items-center justify-center text-4xl">
        <i class="fa-solid fa-check"></i>
      </div>

      <div class="space-y-2">
        <h3 class="text-lg font-black text-khubrat-blue dark:text-white">Subscription renewed successfully</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Your workspace is now running on the <strong>{{ selectedPlan?.name }}</strong> plan.
        </p>
      </div>

      <div class="bg-blue-50/60 dark:bg-slate-900 rounded-xl p-4 border border-blue-100 dark:border-slate-700">
        <p class="text-xs text-slate-600 dark:text-slate-400 mb-1">A confirmation email has just been sent to:</p>
        <p class="font-bold text-khubrat-blue dark:text-khubrat-goldLight">{{ companyEmail || '—' }}</p>
      </div>

      <BaseButton variant="gold" full-width :loading="authStore.loggingOut" @click="goToLogin">
        Go to the login page
      </BaseButton>
    </div>

    <template v-else>
      <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start justify-between gap-4">
        <div class="space-y-1">
          <h3 class="text-md font-bold text-khubrat-blue dark:text-white">Renew Your Subscription</h3>
          <p class="text-xs text-slate-400">
            Pick the plan that fits your company. Paid plans continue to a secure checkout page, free plans are applied immediately.
          </p>
        </div>
        <button
          type="button"
          class="text-xs font-bold text-slate-400 hover:text-khubrat-blue dark:hover:text-khubrat-goldLight whitespace-nowrap"
          @click="router.push({ name: 'company-settings' })"
        >
          <i class="fa-solid fa-arrow-left mr-1"></i> Back to settings
        </button>
      </div>

      <BaseAlert v-if="submitError" variant="error">{{ submitError }}</BaseAlert>

      <div
        v-if="companiesStore.isCompanyFrozen || companiesStore.isSubscriptionExpired"
        class="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2.5"
      >
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span v-if="companiesStore.isCompanyFrozen">
          Your company workspace is frozen. Renew now to reactivate full access for your team.
        </span>
        <span v-else>
          Your subscription has expired. Renew now to restore full access for your team.
        </span>
      </div>

      <div v-if="plansStore.loading" class="py-12">
        <LoadingSpinner class="mx-auto" />
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          v-for="plan in plans"
          :key="plan.id"
          type="button"
          class="text-left border-2 rounded-2xl p-5 transition-all duration-200 bg-white dark:bg-slate-800"
          :class="selectedPlan?.id === plan.id
            ? 'border-khubrat-blue dark:border-khubrat-goldLight bg-blue-50/50 dark:bg-slate-900 shadow-md'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'"
          @click="selectedPlan = plan"
        >
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-bold text-lg text-[#061c3f] dark:text-white">{{ plan.name }}</h3>
            <i
              v-if="selectedPlan?.id === plan.id"
              class="fa-solid fa-circle-check text-khubrat-blue dark:text-khubrat-goldLight mt-1"
            ></i>
          </div>
          <p class="text-2xl font-black mt-2 text-khubrat-goldDark dark:text-khubrat-goldLight">{{ priceLabel(plan) }}</p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">{{ plan.description }}</p>
          <div class="flex flex-wrap gap-2 mt-3">
            <span class="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-[10px] rounded text-slate-600 dark:text-slate-300 font-black uppercase">
              {{ plan.plan_type }}
            </span>
            <span v-if="plan.max_employees" class="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-[10px] rounded text-slate-600 dark:text-slate-300 font-black uppercase">
              {{ plan.max_employees }} employees
            </span>
          </div>
        </button>
      </div>

      <BaseButton
        variant="gold"
        full-width
        :disabled="!selectedPlan"
        :loading="companiesStore.renewing || redirecting"
        @click="handleRenew"
      >
        <template v-if="redirecting">Redirecting to secure checkout…</template>
        <template v-else-if="selectedPlan && Number(selectedPlan.price) === 0">Activate Free Plan</template>
        <template v-else>Continue to Payment</template>
      </BaseButton>
    </template>
  </section>
</template>

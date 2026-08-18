<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { clearPendingCheckout, readPendingCheckout } from '@/utils/paymentSession'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const onboardingStore = useOnboardingStore()

const pending = readPendingCheckout()
const email = ref(pending?.email || onboardingStore.workspace.email || '')
const isRenew = computed(() => pending?.context === 'renew')

const title = computed(() =>
  isRenew.value ? t('onboarding.paymentSuccessRenew') : t('onboarding.paymentSuccessSignup')
)

function goToLogin() {
  clearPendingCheckout()
  onboardingStore.reset()
  router.push({
    name: 'login',
    query: {
      registered: 'true',
      ...(email.value ? { email: email.value } : {})
    }
  })
}

function goToSettings() {
  clearPendingCheckout()
  router.push({ name: 'company-settings' })
}

function paymentDone() {
  if (isRenew.value && authStore.isAuthenticated) {
    goToSettings()
    return
  }
  goToLogin()
}

function retryPayment() {
  clearPendingCheckout()
  if (isRenew.value && authStore.isAuthenticated) {
    router.push({ name: 'company-subscription-renew' })
    return
  }
  onboardingStore.reset()
  router.push({ name: 'signup-workspace' })
}
</script>

<template>
  <AuthLayout :title="title" max-width="max-w-lg">
    <div class="space-y-6">
      <p class="text-center text-slate-600 text-sm leading-relaxed">
        {{ $t('onboarding.checkoutOpened') }}
      </p>

      <div v-if="email" class="bg-blue-50/50 rounded-xl p-4 border border-blue-100 text-center">
        <p class="text-sm text-slate-600 mb-1">{{ $t('onboarding.registeredEmail') }}</p>
        <p class="font-bold text-khubrat-blue text-lg break-all">{{ email }}</p>
      </div>

      <!-- Option 1: something went wrong during checkout -->
      <div class="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 space-y-3">
        <div class="flex items-start gap-3">
          <span class="mt-0.5 w-9 h-9 shrink-0 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </span>
          <div>
            <p class="font-bold text-slate-800">{{ $t('onboarding.paymentProblem') }}</p>
            <p class="text-sm text-slate-600 mt-1">
              {{ isRenew ? $t('onboarding.noChargeRenew') : $t('onboarding.noWorkspaceActivated') }}
            </p>
          </div>
        </div>
        <BaseButton variant="ghost" full-width @click="retryPayment">
          {{ isRenew ? $t('onboarding.choosePlanAgain') : $t('onboarding.registerAgain') }}
        </BaseButton>
      </div>

      <!-- Option 2: payment succeeded, credentials email received -->
      <div class="rounded-2xl border border-green-200 bg-green-50/60 p-5 space-y-3">
        <div class="flex items-start gap-3">
          <span class="mt-0.5 w-9 h-9 shrink-0 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <i class="fa-solid fa-check"></i>
          </span>
          <div>
            <p class="font-bold text-slate-800">
              {{ isRenew ? $t('onboarding.paymentCompletedRenew') : $t('onboarding.paymentCompletedSignup') }}
            </p>
            <p class="text-sm text-slate-600 mt-1">
              {{ isRenew ? $t('onboarding.accessUpdated') : $t('onboarding.tempPasswordHint') }}
            </p>
          </div>
        </div>
        <BaseButton variant="gold" full-width @click="paymentDone">
          {{ isRenew && authStore.isAuthenticated ? $t('onboarding.backToSettings') : $t('onboarding.goLogin') }}
        </BaseButton>
      </div>
    </div>
  </AuthLayout>
</template>

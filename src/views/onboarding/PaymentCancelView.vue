<script setup>
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { clearPendingCheckout, readPendingCheckout } from '@/utils/paymentSession'

const router = useRouter()
const authStore = useAuthStore()
const onboardingStore = useOnboardingStore()

const pending = readPendingCheckout()
const isRenew = pending?.context === 'renew'

function retry() {
  clearPendingCheckout()
  if (isRenew && authStore.isAuthenticated) {
    router.push({ name: 'company-subscription-renew' })
    return
  }
  onboardingStore.reset()
  router.push({ name: 'signup-workspace' })
}
</script>

<template>
  <AuthLayout :title="$t('onboarding.paymentCancelled')" max-width="max-w-lg">
    <div class="text-center space-y-6">
      <div class="mx-auto w-20 h-20 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-4xl">
        <i class="fa-solid fa-ban"></i>
      </div>

      <p class="text-slate-700 text-lg font-medium leading-relaxed">
        {{ $t('onboarding.paymentCancelledBody') }}
      </p>

      <p class="text-sm text-slate-500">
        {{ $t('onboarding.tryAgainReady') }}
      </p>

      <BaseButton variant="gold" full-width @click="retry">
        {{ isRenew ? $t('onboarding.choosePlanAgain') : $t('onboarding.startRegistrationAgain') }}
      </BaseButton>
    </div>
  </AuthLayout>
</template>

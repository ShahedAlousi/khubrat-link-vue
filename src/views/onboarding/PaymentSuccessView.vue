<script setup>
import { computed, ref } from 'vue'
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
const email = ref(pending?.email || onboardingStore.workspace.email || '')
const isRenew = computed(() => pending?.context === 'renew')

const title = computed(() => (isRenew.value ? 'Subscription Payment' : 'Complete Your Payment'))

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
        Checkout was opened in a separate tab. Once you are done there, tell us how it went.
      </p>

      <div v-if="email" class="bg-blue-50/50 rounded-xl p-4 border border-blue-100 text-center">
        <p class="text-sm text-slate-600 mb-1">Registered email:</p>
        <p class="font-bold text-khubrat-blue text-lg break-all">{{ email }}</p>
      </div>

      <!-- Option 1: something went wrong during checkout -->
      <div class="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 space-y-3">
        <div class="flex items-start gap-3">
          <span class="mt-0.5 w-9 h-9 shrink-0 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </span>
          <div>
            <p class="font-bold text-slate-800">Did you face a problem with the payment?</p>
            <p class="text-sm text-slate-600 mt-1">
              {{
                isRenew
                  ? 'No charge was completed. You can pick a plan and pay again.'
                  : 'No workspace was activated. You can start the registration again.'
              }}
            </p>
          </div>
        </div>
        <BaseButton variant="ghost" full-width @click="retryPayment">
          {{ isRenew ? 'Choose a plan again' : 'Register again' }}
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
              {{
                isRenew
                  ? 'Was the payment completed successfully?'
                  : 'Payment done and you received the temporary password email?'
              }}
            </p>
            <p class="text-sm text-slate-600 mt-1">
              {{
                isRenew
                  ? 'Your workspace access has been updated.'
                  : 'Sign in with the temporary password, then you will be asked to set a new one.'
              }}
            </p>
          </div>
        </div>
        <BaseButton variant="gold" full-width @click="paymentDone">
          {{ isRenew && authStore.isAuthenticated ? 'Back to settings' : 'Go to the login page' }}
        </BaseButton>
      </div>
    </div>
  </AuthLayout>
</template>

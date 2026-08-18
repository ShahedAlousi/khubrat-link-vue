<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { useOnboardingStore } from '@/stores/onboarding.store'
// نفترض أن الـ Store الخاص بالباقات موجود بهذا الاسم وفقا لمعمارية المشروع
import { useSubscriptionPlansStore } from '@/stores/subscriptionPlans.store'
import { translateStatus } from '@/i18n/helpers'

const { t } = useI18n()
const router = useRouter()
const onboardingStore = useOnboardingStore()
const plansStore = useSubscriptionPlansStore()

const selectedPlan = ref(null)
const fetchError = ref('')

onMounted(async () => {
  // حماية المسار: تأكد من إتمام الخطوة الأولى
  if (!onboardingStore.hasWorkspaceStep) {
    router.replace({ name: 'signup-workspace' })
    return
  }

  try {
    await plansStore.fetchPlans() 
  } catch (err) {
    fetchError.value = err.message
  }
})

const plans = computed(() => plansStore.plans)

function planPriceLabel(plan) {
  return plan.price === 0 ? t('common.free') : `$${plan.price}`
}

function planTypeLabel(planType) {
  if (planType === 'free') return t('common.free')
  if (planType === 'paid') return t('common.paid')
  return translateStatus(planType)
}

function handleContinue() {
  if (!selectedPlan.value) return
  onboardingStore.setPlanStep(selectedPlan.value)
  router.push({ name: 'signup-admin' })
}
</script>

<template>
  <AuthLayout
    :title="$t('onboarding.choosePlan')"
    :subtitle="$t('onboarding.choosePlanSubtitle')"
    max-width="max-w-3xl"
    :back-label="$t('common.back')"
    @back="router.push({ name: 'signup-workspace' })"
  >
    <BaseAlert v-if="fetchError" variant="error" class="mb-4">{{ fetchError }}</BaseAlert>

    <div v-if="plansStore.loading" class="flex justify-center py-10">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-khubrat-blue"></div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div 
        v-for="plan in plans" 
        :key="plan.id"
        @click="selectedPlan = plan"
        class="border-2 rounded-xl p-5 cursor-pointer transition-all duration-200"
        :class="selectedPlan?.id === plan.id ? 'border-khubrat-blue bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'"
      >
        <h3 class="font-bold text-lg text-[#061c3f]">{{ plan.name }}</h3>
        <p class="text-2xl font-bold mt-2 text-khubrat-goldDark">
          {{ planPriceLabel(plan) }}
        </p>
        <p class="text-sm text-slate-500 mt-2">{{ plan.description }}</p>
        <span class="inline-block mt-3 px-2 py-1 bg-slate-100 text-xs rounded text-slate-600 font-semibold uppercase">
          {{ planTypeLabel(plan.plan_type) }}
        </span>
      </div>
    </div>

    <BaseButton 
      @click="handleContinue" 
      variant="gold" 
      full-width 
      :disabled="!selectedPlan"
    >
      {{ $t('onboarding.continueAccount') }}
    </BaseButton>
  </AuthLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { useCompaniesStore } from '@/stores/companies.store'
import { isRequired, isValidPhone } from '@/utils/validators'
import { resolveCheckout } from '@/utils/checkout'
import { savePendingCheckout } from '@/utils/paymentSession'

const router = useRouter()
const onboardingStore = useOnboardingStore()
const companiesStore = useCompaniesStore()

// Guard: تأكد من إتمام خطوة بيانات الشركة واختيار الباقة
onMounted(() => {
  if (!onboardingStore.hasWorkspaceStep) {
    router.replace({ name: 'signup-workspace' })
  } else if (!onboardingStore.hasPlanStep) {
    router.replace({ name: 'signup-plan' })
  }
})

const form = reactive({ firstName: '', lastName: '', phone: '', address: '' })
const fieldErrors = reactive({ firstName: '', lastName: '', phone: '', address: '' })
const submitError = ref('')
const submitting = ref(false)

function validate() {
  fieldErrors.firstName = isRequired(form.firstName) ? '' : 'First name is required.'
  fieldErrors.lastName = isRequired(form.lastName) ? '' : 'Last name is required.'
  if (!isRequired(form.phone)) {
    fieldErrors.phone = 'Phone number is required.'
  } else if (!isValidPhone(form.phone)) {
    fieldErrors.phone = 'Phone must start with 09 and contain 10 digits.'
  } else {
    fieldErrors.phone = ''
  }
  fieldErrors.address = isRequired(form.address) ? '' : 'Company address is required.'
  return !fieldErrors.firstName && !fieldErrors.lastName && !fieldErrors.phone && !fieldErrors.address
}

async function handleSubmit() {
  submitError.value = ''
  if (!validate()) return

  submitting.value = true
  const isPaidPlan = onboardingStore.plan?.plan_type !== 'free'
  // فتح النافذة مبكراً قبل await حتى لا يحجب المتصفح النافذة المنبثقة
  const checkoutTab = isPaidPlan ? window.open('about:blank', '_blank') : null

  try {
    const response = await companiesStore.registerCompany({
      name: onboardingStore.workspace.name,
      email: onboardingStore.workspace.email,
      address: form.address,
      contact_name: `${form.firstName} ${form.lastName}`.trim(),
      phone: form.phone,
      plan_id: onboardingStore.plan.id,
      payment_status: isPaidPlan ? 'pending' : 'active'
    })

    const checkout = resolveCheckout(response)

    if (checkout.paymentRequired && checkout.paymentUrl) {
      savePendingCheckout({
        sessionId: checkout.sessionId,
        email: onboardingStore.workspace.email,
        context: 'signup'
      })

      if (checkoutTab) {
        checkoutTab.location.href = checkout.paymentUrl
      } else {
        window.location.href = checkout.paymentUrl
        return
      }

      await router.push({
        name: 'payment-success',
        query: checkout.sessionId ? { session_id: checkout.sessionId } : {}
      })
      return
    }

    if (checkoutTab) checkoutTab.close()
    router.push({ name: 'signup-success' })
  } catch (err) {
    if (checkoutTab) checkoutTab.close()
    submitError.value = err.message
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout
    title="Welcome to Khebrat Link!"
    subtitle="Let's set up your admin account"
    max-width="max-w-2xl"
    back-label="Go Back"
    @back="router.push({ name: 'signup-plan' })"
  >
    <form class="space-y-5" @submit.prevent="handleSubmit">
      <BaseAlert v-if="submitError" variant="error">{{ submitError }}</BaseAlert>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <BaseInput v-model="form.firstName" label="First Name of General Manager" required :error="fieldErrors.firstName" />
        <BaseInput v-model="form.lastName" label="Last Name of General Manager" required :error="fieldErrors.lastName" />
        <BaseInput
          v-model="form.phone"
          label="Phone Number"
          placeholder="09xxxxxxxx"
          required
          :error="fieldErrors.phone"
        />
        <BaseInput v-model="form.address" label="Company Address" required :error="fieldErrors.address" />
      </div>

      <BaseButton type="submit" variant="gold" full-width :loading="submitting">
        {{ submitting ? 'Processing...' : 'Complete Registration' }}
      </BaseButton>
    </form>
  </AuthLayout>
</template>

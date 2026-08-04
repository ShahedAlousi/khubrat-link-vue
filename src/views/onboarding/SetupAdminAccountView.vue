<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { useCompaniesStore } from '@/stores/companies.store'
import { isRequired } from '@/utils/validators'

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
  fieldErrors.phone = isRequired(form.phone) ? '' : 'Phone number is required.'
  fieldErrors.address = isRequired(form.address) ? '' : 'Company address is required.'
  return !fieldErrors.firstName && !fieldErrors.lastName && !fieldErrors.phone && !fieldErrors.address
}

async function handleSubmit() {
  submitError.value = ''
  if (!validate()) return

  submitting.value = true
  try {
    await companiesStore.registerCompany({
      name: onboardingStore.workspace.name,
      email: onboardingStore.workspace.email,
      address: form.address,
      contact_name: `${form.firstName} ${form.lastName}`.trim(),
      phone: form.phone,
      // التعديل: إرسال الباقة المختارة ديناميكياً بدلاً من القيم الثابتة
      plan_id: onboardingStore.plan.id,
      payment_status: onboardingStore.plan.plan_type === 'free' ? 'active' : 'pending'
    })

    // التوجيه بناء على نوع الباقة
    if (onboardingStore.plan.plan_type === 'free') {
      router.push({ name: 'signup-success' })
    } else {
      // PLACEHOLDER: توجيه لبوابة الدفع (Syriatel Cash وغيرها) غير موثق بالـ API حالياً
      alert('سيتم توجيهك الآن إلى بوابة الدفع الإلكتروني...') 
    }
  } catch (err) {
    submitError.value = err.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout
    title="Welcome to Khubrat!"
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
        <BaseInput v-model="form.phone" label="Phone Number" required :error="fieldErrors.phone" />
        <BaseInput v-model="form.address" label="Company Address" required :error="fieldErrors.address" />
      </div>

      <BaseButton type="submit" variant="gold" full-width :loading="submitting">Complete Registration</BaseButton>
    </form>
  </AuthLayout>
</template>
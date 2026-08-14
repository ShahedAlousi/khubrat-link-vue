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
    // حفظ الاستجابة لفحصها
    const response = await companiesStore.registerCompany({
      name: onboardingStore.workspace.name,
      email: onboardingStore.workspace.email,
      address: form.address,
      contact_name: `${form.firstName} ${form.lastName}`.trim(),
      phone: form.phone,
      plan_id: onboardingStore.plan.id,
      payment_status: onboardingStore.plan.plan_type === 'free' ? 'active' : 'pending'
    })

    // التوجيه بناء على الاستجابة من الـ API
    if (response.payment_required && response.payment_url) {
      // إعادة التوجيه إلى بوابة الدفع في نفس التبويب
      window.location.href = response.payment_url
    } else {
      // في حال الباقة المجانية
      router.push({ name: 'signup-success' })
    }
  } catch (err) {
    submitError.value = err.message
    // نوقف التحميل فقط في حال حدوث خطأ لتجنب تجميد الواجهة
    submitting.value = false 
  } 
  // تم إزالة block finally عمداً ليبقى زر التسجيل في حالة التحميل 
  // ريثما يتم انتقال المتصفح إلى رابط بوابة الدفع
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
        <BaseInput v-model="form.phone" label="Phone Number" required :error="fieldErrors.phone" />
        <BaseInput v-model="form.address" label="Company Address" required :error="fieldErrors.address" />
      </div>

      <BaseButton type="submit" variant="gold" full-width :loading="submitting">
        {{ submitting ? 'Processing...' : 'Complete Registration' }}
      </BaseButton>
    </form>
  </AuthLayout>
</template>
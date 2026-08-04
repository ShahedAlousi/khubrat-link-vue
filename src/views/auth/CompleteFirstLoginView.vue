<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { useAuthStore } from '@/stores/auth.store'
import { minLength } from '@/utils/validators'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({ password: '', confirmPassword: '' })
const fieldErrors = reactive({ password: '', confirmPassword: '' })
const submitError = ref('')
const submitting = ref(false)

function validate() {
  fieldErrors.password = minLength(form.password, 8) ? '' : 'Password must be at least 8 characters.'
  fieldErrors.confirmPassword = form.confirmPassword === form.password ? '' : 'Passwords do not match.'
  return !fieldErrors.password && !fieldErrors.confirmPassword
}

async function handleSubmit() {
  submitError.value = ''
  if (!validate()) return

  submitting.value = true
  try {
    await authStore.completeFirstLogin({
      password: form.password,
      password_confirmation: form.confirmPassword
    })
    router.push({ name: 'dashboard-overview' })
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
    subtitle="For your security, please set a new password before continuing."
  >
    <form class="space-y-5" @submit.prevent="handleSubmit">
      <BaseAlert v-if="submitError" variant="error">{{ submitError }}</BaseAlert>

      <BaseInput
        v-model="form.password"
        type="password"
        label="New Password"
        placeholder="••••••••"
        autocomplete="new-password"
        required
        :error="fieldErrors.password"
      />
      <BaseInput
        v-model="form.confirmPassword"
        type="password"
        label="Confirm New Password"
        placeholder="••••••••"
        autocomplete="new-password"
        required
        :error="fieldErrors.confirmPassword"
      />

      <BaseButton type="submit" variant="gold" full-width :loading="submitting">Continue to Dashboard</BaseButton>
    </form>
  </AuthLayout>
</template>

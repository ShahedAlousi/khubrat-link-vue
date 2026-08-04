<script setup>
import { ref } from 'vue'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { useAuthStore } from '@/stores/auth.store'
import { isValidEmail } from '@/utils/validators'

const authStore = useAuthStore()

const email = ref('')
const emailError = ref('')
const submitError = ref('')
const submitted = ref(false)
const submitting = ref(false)

async function handleSubmit() {
  submitError.value = ''
  emailError.value = isValidEmail(email.value) ? '' : 'Enter a valid email address.'
  if (emailError.value) return

  submitting.value = true
  try {
    await authStore.forgotPassword(email.value)
    submitted.value = true
  } catch (err) {
    submitError.value = err.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout
    title="Forgot Password?"
    subtitle="Enter your account email and we'll generate a reset link."
  >
    <div v-if="submitted" class="space-y-5 text-center">
      <BaseAlert variant="success">
        If an account exists for <strong>{{ email }}</strong>, a password reset link has been sent.
      </BaseAlert>
      <router-link :to="{ name: 'login' }" class="text-sm font-bold text-khubrat-blue dark:text-khubrat-goldLight hover:underline">
        Back to sign in
      </router-link>
    </div>

    <form v-else class="space-y-5" @submit.prevent="handleSubmit">
      <BaseAlert v-if="submitError" variant="error">{{ submitError }}</BaseAlert>

      <BaseInput
        v-model="email"
        type="email"
        label="Email Address"
        placeholder="hr@khibrat.com"
        autocomplete="username"
        required
        :error="emailError"
      />

      <BaseButton type="submit" variant="gold" full-width :loading="submitting">Send Reset Link</BaseButton>

      <p class="text-center text-sm text-slate-600 dark:text-slate-300">
        Remembered it?
        <router-link :to="{ name: 'login' }" class="font-bold text-khubrat-blue dark:text-khubrat-goldLight hover:underline">
          Back to sign in
        </router-link>
      </p>
    </form>
  </AuthLayout>
</template>
